"""
Imports the GEOmetadb gse table from a DuckDB file into the database.
"""

from pathlib import Path

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import duckdb

from api.models import (
    GEOSeriesMetadata,
)

# ============================================================================
# === entrypoint
# ============================================================================

class Command(BaseCommand):
    help = "Import GEOmetadb's gse table into a meta2onto model."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the GEOmetadb__gse.duckdb file"
        )
        parser.add_argument("--geometadb-gse-db", default="GEOmetadb__gse.duckdb")

        # add an argument to delete all existing data before import?
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Clear existing search data before import."
        )

    def handle(self, *args, **opts):
        root = Path(opts["root"]).expanduser().resolve()
        if not root.exists():
            raise CommandError(f"Root folder not found: {root}")

        geometadb_gse_db = root / opts["geometadb_gse_db"]

        self.stdout.write(self.style.MIGRATE_HEADING("Starting GEOmetadb gse import"))

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(self.style.WARNING("Clearing existing GEOmetadb gse data..."))

                models_to_clear = (
                    GEOSeriesMetadata,
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )
                
        self.stdout.write(self.style.HTTP_INFO(f"Importing: {geometadb_gse_db}"))

        con = duckdb.connect(database=str(geometadb_gse_db), read_only=True)

        # GEOSeriesMetadata
        self.stdout.write(self.style.HTTP_INFO("→ Importing GEOSeriesMetadata..."))
        rows = con.execute("""
            SELECT 
                title,
                gse,
                status,
                submission_date,
                last_update_date,
                pubmed_id,
                summary,
                type,
                'n/a' as contributor,
                web_link,
                overall_design,
                repeats,
                repeats_sample_list,
                variable,
                variable_description,
                contact,
                supplementary_file
            FROM gse
        """).fetchall()
        GEOSeriesMetadata.objects.bulk_create([
            GEOSeriesMetadata(
                title=row[0],
                gse=row[1],
                status=row[2],
                submission_date=row[3],
                last_update_date=row[4],
                pubmed_id=row[5],
                summary=row[6],
                type=row[7],
                # contributor=row[8],
                contributor=None,
                web_link=row[9],
                overall_design=row[10],
                repeats=row[11],
                repeats_sample_list=row[12],
                variable=row[13],
                variable_description=row[14],
                contact=row[15],
                supplementary_file=row[16],
            ) for row in tqdm(rows)
        ], ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS("✓ GEOSeriesMetadata imported"))

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
