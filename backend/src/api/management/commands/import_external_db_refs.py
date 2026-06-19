"""
Populates the model ExternalDbRefs with relations from GEO series to external dbs, using the following files:
data/expression_db_references/archs4_*.(txt|parquet)
data/expression_db_references/recount3_*.(txt|parquet)
data/expression_db_references/refinebio_*.(txt|parquet)
"""

import math
from pathlib import Path

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import pyarrow.parquet as pq

from api.models import ExternalDbRefs

# ============================================================================
# === Utilities
# ============================================================================


def _total_batches(pf: pq.ParquetFile, batch_size: int) -> int:
    total_rows = sum(
        pf.metadata.row_group(i).num_rows for i in range(pf.num_row_groups)
    )
    return math.ceil(total_rows / batch_size)


# ============================================================================
# === Importers
# ============================================================================

# size of batches to process at a time
DEFAULT_BATCH_SIZE = 5000


# @transaction.atomic
def import_external_db_refs(db_name: str, path: Path, batch_size: int = DEFAULT_BATCH_SIZE):
    """
    *_predictions.parquet files have the following columns:
      term, ID (GSE), confidence, related_words
    """

    inserted = 0
    
    # check if path ends with .txt or .parquet, and read accordingly
    if path.suffix == ".txt":
        # the archs4 file, provided as text, appears to consist of
        # one or more GSE IDs, comma-delimited, per line. presumably
        # these are all in archs4, so we just collect them into a set and
        # insert a relation to archs4 per GSE ID
        with open(path, "r") as f:
            gse_ids = set()
            
            for line in f:
                gse_ids.update(line.strip().split(","))

            print(f"Processed {len(gse_ids)} unique GSE IDs", end="\r")
            
            inserted += len(ExternalDbRefs.objects.bulk_create(
                [
                    ExternalDbRefs(
                        series_id=gse_id,
                        database=db_name,
                        external_id=None
                    )
                    for gse_id in gse_ids
                ],
                ignore_conflicts=True,
            ))

    elif path.suffix == ".parquet":
        # the parquet files consist of rows with columns (geo, accession), where
        # geo is the GSE ID and accession is the external db ID. we insert a
        # relation for each row.
        pf = pq.ParquetFile(path)

        for batch in tqdm(
            pf.iter_batches(batch_size=batch_size),
            total=_total_batches(pf, batch_size),
            desc=f"Importing {db_name} into ExternalDbRefs",
        ):
            with transaction.atomic():
                rows = batch.to_pylist()

                # presume the GEOSeries we're linking to exists, and if it doesn't skip insertion

                # now, bulk create ExternalDbRefs entries
                inserted += len(ExternalDbRefs.objects.bulk_create(
                    [
                        ExternalDbRefs(
                            series_id=row["geo"],
                            database=db_name,
                            external_id=row.get("accession", None),
                        )
                        for row in rows
                    ],
                    ignore_conflicts=True,
                ))
    
    return inserted

# ============================================================================
# === entrypoint
# ============================================================================


class Command(BaseCommand):
    help = "Import external database references (e.g., archs4, recount3, refine.bio) into ExternalDbRefs."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the external db reference parquet/txt files",
        )

        # add an argument to delete all existing data before import?
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Clear existing search data before import.",
        )

    def handle(self, *args, **opts):
        root = Path(opts["root"]).expanduser().resolve()
        if not root.exists():
            raise CommandError(f"Root folder not found: {root}")

        self.stdout.write(self.style.MIGRATE_HEADING("Starting ExternalDbRefs import"))

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(self.style.WARNING("Clearing existing ExternalDbRefs data..."))

                models_to_clear = (
                    ExternalDbRefs,
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )

        for external_db in ('archs4', 'recount3', 'refinebio'):
            # find a file under root that matches <external_db>_*.txt or <external_db>_*.parquet
            matching_files = list(root.glob(f"{external_db}_*.txt")) + list(root.glob(f"{external_db}_*.parquet"))

            #  map 'refinebio' to the canonical 'refine.bio', even though the filename doesn't include it
            db_name = 'refine.bio' if external_db == 'refinebio' else external_db

            if not matching_files:
                self.stdout.write(self.style.WARNING(f"No file found for {external_db}, skipping..."))
                continue
            elif len(matching_files) > 1:
                self.stdout.write(self.style.WARNING(f"Multiple files found for {external_db}, using the first one: {matching_files[0]}"))
            
            file_to_import = matching_files[0]

            # import that file; import_external_db_refs will determine if it's parquet or txt based on the extension and import it appropriately
            self.stdout.write(self.style.HTTP_INFO(f"Importing: {file_to_import}"))
            inserted = import_external_db_refs(db_name=db_name, path=file_to_import, batch_size=500)
            self.stdout.write(self.style.SUCCESS(f"✓ {inserted} {db_name} reference(s) imported"))


        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
