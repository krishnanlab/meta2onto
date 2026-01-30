"""
Imports the GEOmetadb's gse, gsm, and gpl tables from a DuckDB file into Postgres
using COPY FROM STDIN for high-performance bulk loading.

Flow per table (gse/gsm/gpl):
- Stream rows from DuckDB in chunks, writing to a temporary CSV (NULL -> \\N).
- COPY the CSV into the target Postgres table.

Notes:
- Use --clear-existing to TRUNCATE target tables before import. Without clearing,
  duplicates (violating unique constraints) will raise errors as COPY does not
  support ON CONFLICT. If you need upsert behavior, import into a staging table
  and INSERT ... ON CONFLICT from there (not implemented here).
"""

from pathlib import Path

from tqdm import tqdm
import csv
import tempfile
from typing import Iterable

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection, connections

import duckdb
import gc
import psycopg2

from api.models import (
    GEOSeriesMetadata, GEOSampleMetadata, GEOPlatformMetadata
)

from django.conf import settings
from django.db import reset_queries

# before the import loop
connections['default'].force_debug_cursor = False

# ============================================================================
# === entrypoint
# ============================================================================

def _truncate_cells(row, max_length=65535):
    """Truncate any cell in the row that exceeds max_length."""
    return tuple(
        (val[:max_length] if isinstance(val, str) and len(val) > max_length else val)
        for val in row
    )

def _normalize_cell_for_csv(val):
    """Convert Python value to CSV-safe representation.

    - None -> "\\N" to be interpreted as NULL by COPY.
    - Other values -> str(val).
    """
    if val is None:
        return "\\N"
    return str(val)

def _quote_ident(name: str) -> str:
    """Safely double-quote a SQL identifier (table/column)."""
    return '"' + name.replace('"', '""') + '"'

class Command(BaseCommand):
    help = "Import GEOmetadb's gse table into a meta2onto model."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the GEOmetadb__gse_gsm_gpl.duckdb file"
        )
        parser.add_argument("--geometadb-db", default="GEOmetadb__gse_gsm_gpl.duckdb")

        # add an argument to delete all existing data before import?
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Clear existing search data before import."
        )

    def _copy_from_duckdb(self, src_table: str, model, cols: tuple, chunk_size: int = 10000, verbose: bool = True, con=None, path_to_db: Path = None):
        """Stream rows from DuckDB, write to temp CSV, and COPY into Postgres.

        - src_table: DuckDB source table name (gse/gsm/gpl)
        - model: Django model to determine destination table name
        - cols: column names to select from src_table and copy into destination
        - chunk_size: number of rows to fetch from DuckDB per iteration
        """
        if verbose:
            self.stdout.write(self.style.HTTP_INFO(
                f"→ COPY {src_table} → {_quote_ident(model._meta.db_table)} with chunk size {chunk_size}..."
            ))

        if con is None:
            if path_to_db is None:
                raise ValueError("Either 'con' or 'path_to_db' must be provided.")
            con = duckdb.connect(database=str(path_to_db), read_only=True, config={'memory_limit': "8GB"})

        # Count total rows for progress
        cursor = con.execute(f"SELECT COUNT(*) FROM {src_table}")
        total_rows = cursor.fetchone()[0]
        if verbose:
            self.stdout.write(self.style.HTTP_INFO(f"  → {total_rows} rows to import."))

        # Prepare temp CSV file
        temp_csv = tempfile.NamedTemporaryFile(mode="w", newline="", suffix=f"_{src_table}.csv", delete=False)
        csv_path = Path(temp_csv.name)
        writer = csv.writer(temp_csv, quoting=csv.QUOTE_MINIMAL, lineterminator='\n')

        # Stream from DuckDB → CSV
        cursor = con.execute(f"SELECT {', '.join(cols)} FROM {src_table}")
        written = 0
        with tqdm(total=total_rows, desc=f"Writing {src_table} CSV", unit="rows") as pbar:
            while True:
                if settings.DEBUG:
                    reset_queries()

                rows_chunk = cursor.fetchmany(chunk_size)
                if not rows_chunk:
                    break

                for row in rows_chunk:
                    truncated = _truncate_cells(row)
                    writer.writerow([_normalize_cell_for_csv(v) for v in truncated])
                written += len(rows_chunk)
                pbar.update(len(rows_chunk))

                # Free memory
                del rows_chunk
                gc.collect()

        temp_csv.flush()
        temp_csv.close()

        if verbose:
            self.stdout.write(self.style.HTTP_INFO(f"  → CSV ready: {csv_path} ({written} rows)"))

        # COPY into Postgres
        dest_table = model._meta.db_table
        cols_sql = ", ".join(_quote_ident(c) for c in cols)
        copy_sql = (
            f"COPY {_quote_ident(dest_table)} ({cols_sql}) "
            f"FROM STDIN WITH (FORMAT CSV, HEADER FALSE, NULL '\\N')"
        )

        # Connect directly with psycopg2 to get a real cursor with copy_expert
        conn_settings = connection.settings_dict
        pg_conn = psycopg2.connect(
            host=conn_settings.get('HOST'),
            port=conn_settings.get('PORT', 5432),
            database=conn_settings.get('NAME'),
            user=conn_settings.get('USER'),
            password=conn_settings.get('PASSWORD'),
        )
        pg_cursor = pg_conn.cursor()
        try:
            with csv_path.open('r') as f:
                pg_cursor.copy_expert(copy_sql, f)
            pg_conn.commit()
        except Exception:
            pg_conn.rollback()
            raise
        finally:
            pg_cursor.close()
            pg_conn.close()

        # Cleanup temp CSV
        try:
            csv_path.unlink(missing_ok=True)
        except Exception:
            pass

        if verbose:
            self.stdout.write(self.style.SUCCESS(f"✓ {model.__name__} imported via COPY"))


    def handle(self, *args, **opts):
        root = Path(opts["root"]).expanduser().resolve()
        if not root.exists():
            raise CommandError(f"Root folder not found: {root}")

        geometadb_db = root / opts["geometadb_db"]

        self.stdout.write(self.style.MIGRATE_HEADING("Starting GEOmetadb import"))

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(self.style.WARNING("Clearing existing GEOmetadb data..."))

                models_to_clear = (
                    GEOSeriesMetadata, GEOSampleMetadata, GEOPlatformMetadata,
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )
                
        self.stdout.write(self.style.HTTP_INFO(f"Importing: {geometadb_db}"))

        # con = duckdb.connect(database=str(geometadb_db), read_only=True, config={'memory_limit': "8GB"})

        # GEOSeriesMetadata via COPY
        self._copy_from_duckdb(
            path_to_db=geometadb_db,
            src_table="gse",
            model=GEOSeriesMetadata,
            cols=(
                'title',
                'gse',
                'status',
                'submission_date',
                'last_update_date',
                'pubmed_id',
                'summary',
                'type',
                'web_link',
                'overall_design',
                'repeats',
                'repeats_sample_list',
                'variable',
                'variable_description',
                'contact',
                'supplementary_file',
            ),
            chunk_size=10000,
        )

        # GEOSampleMetadata via COPY
        self._copy_from_duckdb(
            path_to_db=geometadb_db,
            src_table="gsm",
            model=GEOSampleMetadata,
            cols=(
                'gsm',
                'title',
                'series_id',
                'gpl',
                'status',
                'submission_date',
                'last_update_date',
                'type',
                'source_name_ch1',
                'organism_ch1',
                'characteristics_ch1',
                'molecule_ch1',
                'label_ch1',
                'treatment_protocol_ch1',
                'extract_protocol_ch1',
                'label_protocol_ch1',
                'source_name_ch2',
                'organism_ch2',
                'characteristics_ch2',
                'molecule_ch2',
                'label_ch2',
                'treatment_protocol_ch2',
                'extract_protocol_ch2',
                'label_protocol_ch2',
                'hyb_protocol',
                'description',
                'data_processing',
                'contact',
                'supplementary_file',
                'data_row_count',
                'channel_count',
            ),
            chunk_size=10000,
        )

        # GEOPlatformMetadata via COPY
        self._copy_from_duckdb(
            path_to_db=geometadb_db,
            src_table="gpl",
            model=GEOPlatformMetadata,
            cols=(
                'gpl',
                'title',
                'status',
                'submission_date',
                'last_update_date',
                'technology',
                'distribution',
                'organism',
                'manufacturer',
                'manufacture_protocol',
                'coating',
                'catalog_number',
                'support',
                'description',
                'web_link',
                'contact',
                'data_row_count',
                'supplementary_file',
                'bioc_package',
            ),
            chunk_size=10000,
        )

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
