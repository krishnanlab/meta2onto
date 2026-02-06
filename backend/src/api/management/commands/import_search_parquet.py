"""
Imports search term parquet into SearchTerm model.
"""

import math
from pathlib import Path

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import pyarrow.parquet as pq

from api.models import (
    SearchTerm, GEOSeries
)

# ============================================================================
# === Utilities
# ============================================================================

def _total_batches(pf: pq.ParquetFile, batch_size: int) -> int:
    total_rows = sum(pf.metadata.row_group(i).num_rows for i in range(pf.num_row_groups))
    return math.ceil(total_rows / batch_size)

# ============================================================================
# === Importers
# ============================================================================

# size of batches to process at a time
DEFAULT_BATCH_SIZE = 5000

# @transaction.atomic
def import_search_terms(path: Path, batch_size:int = DEFAULT_BATCH_SIZE):
    """
    meta2onto_example_predictions.parquet
      columns: term, ID, prob, log2(prob/prior), related_words
    """

    pf = pq.ParquetFile(path)

    for batch in tqdm(pf.iter_batches(batch_size=batch_size), total=_total_batches(pf, batch_size), desc="Importing SearchTerm"):
        with transaction.atomic():
            rows = batch.to_pylist()

            # first, insert all samples that might be missing
            for row in rows:
                if row['ID'].startswith('GSE'):
                    GEOSeries.objects.get_or_create(series_id=row['ID'])

            # now, bulk create SearchTerm entries
            SearchTerm.objects.bulk_create([
                SearchTerm(
                    term=row['term'],
                    series_id=row['ID'] if row['ID'].startswith('GSE') else None,
                    prob=row['prob'],
                    log2_prob_prior=row['log2(prob/prior)'],
                    related_words=row['related_words'],
                ) for row in rows
            ], ignore_conflicts=True)

# ============================================================================
# === entrypoint
# ============================================================================

class Command(BaseCommand):
    help = "Import GEO Parquet dumps into normalized Django models."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the meta2onto_example_predictions.parquet file"
        )
        parser.add_argument("--search-terms", default="meta2onto_example_predictions.parquet")

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

        search_terms = root / opts["search_terms"]

        self.stdout.write(self.style.MIGRATE_HEADING("Starting search term import"))

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(self.style.WARNING("Clearing existing GEO data..."))

                models_to_clear = (
                    SearchTerm,
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )
                
        # this one's simpler, just rows consisting of (sample, series, platform, organism, status)
        self.stdout.write(self.style.HTTP_INFO(f"Importing: {search_terms}"))
        import_search_terms(search_terms, batch_size=500)
        self.stdout.write(self.style.SUCCESS("✓ search-terms imported"))

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
