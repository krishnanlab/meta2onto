"""
Imports the GEOmetadb's gse, gsm, and gpl tables from a DuckDB file into the database.
"""

from pathlib import Path

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import duckdb
import gc

from api.models import (
    GEOSeries, GEOSample, GEOPlatform
)

from django.conf import settings
from django.db import reset_queries, connections

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

    def _import_to_model(self, src_table:str, model, cols:tuple, chunk_size:int=10000, batch_size:int|None=None, verbose=True, con=None, path_to_db: Path=None):
        """
        Given a DuckDB connection, import data from src_table into the given Django model.
        'cols' specifies the columns to import for each row and must match the model fields.

        Runs the import in chunks of chunk_size to avoid out of memory issues.
        
        :param self: Description
        :param con: Description
        :param src_table: Description
        :type src_table: str
        :param model: Description
        :param cols: Description
        :type cols: tuple
        :param chunk_size: Description
        :type chunk_size: int
        :param verbose: Description
        """
        if verbose:
            self.stdout.write(self.style.HTTP_INFO(f"→ Importing {src_table} into {model.__name__} with chunk size {chunk_size}, batch size {batch_size}..."))

        if con is None:
            if path_to_db is None:
                raise ValueError("Either 'con' or 'path_to_db' must be provided.")
            con = duckdb.connect(database=str(path_to_db), read_only=True, config={'memory_limit': "8GB"})

        # first, count the number of rows in the source table
        cursor = con.execute(f"SELECT COUNT(*) FROM {src_table}")
        total_rows = cursor.fetchone()[0]
        if verbose:
            self.stdout.write(self.style.HTTP_INFO(f"  → {total_rows} rows to import."))

        cursor = con.execute(f""" SELECT {", ".join(cols)} FROM {src_table} """)
        with tqdm(total=total_rows, desc=f"Importing {model.__name__}", unit="rows") as pbar:
            while True:
                # inside the loop (optional safety if you can't guarantee DEBUG=False)
                if settings.DEBUG:
                    reset_queries()

                with transaction.atomic():
                    rows_chunk = cursor.fetchmany(chunk_size)

                    if not rows_chunk:
                        break

                    objs = [
                        model(**dict(
                            zip(cols, _truncate_cells(row))
                        ))
                        for row in rows_chunk
                    ]

                    model.objects.bulk_create(
                        objs,
                        ignore_conflicts=True,
                        batch_size=batch_size
                    )
                    pbar.update(len(rows_chunk))
                    
                    # aggressively garbage collect to avoid OOM kill
                    del objs, rows_chunk
                    gc.collect()

        if verbose:
            self.stdout.write(self.style.SUCCESS(f"✓ {model.__name__} imported"))


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
                    GEOSeries, GEOSample, GEOPlatform,
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )
                
        self.stdout.write(self.style.HTTP_INFO(f"Importing: {geometadb_db}"))

        # con = duckdb.connect(database=str(geometadb_db), read_only=True, config={'memory_limit': "8GB"})

        # GEOSeries
        self._import_to_model(
            path_to_db=geometadb_db,
            src_table="gse",
            model=GEOSeries,
            cols = (
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
                'supplementary_file'
            )
        )

        # GEOSample
        self._import_to_model(
            path_to_db=geometadb_db,
            src_table="gsm",
            model=GEOSample,
            cols = (
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
                'channel_count'
            ),
            chunk_size=1000,
            batch_size=500
        )

        # GEOPlatform
        self._import_to_model(
            path_to_db=geometadb_db,
            src_table="gpl",
            model=GEOPlatform,
            cols = (
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
                'bioc_package'
            )
        )

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
