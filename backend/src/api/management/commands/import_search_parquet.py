"""
Imports search term parquet into SearchTerm model.
"""

import math
from pathlib import Path

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import pyarrow.parquet as pq

from api.models import SearchTerm, GEOSeries, OntologyTermRating

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
def import_search_terms(path: Path, batch_size: int = DEFAULT_BATCH_SIZE, create_missing: bool = False):
    """
    *_predictions.parquet files have the following columns:
      term, ID (GSE), confidence, related_words
    """

    pf = pq.ParquetFile(path)
    inserted = 0

    for batch in tqdm(
        pf.iter_batches(batch_size=batch_size),
        total=_total_batches(pf, batch_size),
        desc="Importing SearchTerm",
    ):
        with transaction.atomic():
            rows = batch.to_pylist()

            # first, insert all samples that might be missing
            if create_missing:
                for row in rows:
                    if row["ID"].startswith("GSE"):
                        GEOSeries.objects.get_or_create(gse=row["ID"])

            # now, bulk create SearchTerm entries
            inserted += len(SearchTerm.objects.bulk_create(
                [
                    SearchTerm(
                        term=row["term"],
                        series_id=row["ID"] if row["ID"].startswith("GSE") else None,
                        confidence=row["confidence"],
                        related_words=row["related_words"],
                    )
                    for row in rows
                ],
                ignore_conflicts=True,
            ))
    
    return inserted

def import_eval_terms(path: Path, batch_size: int = DEFAULT_BATCH_SIZE):
    """
    eval.parquet file has the following columns:
      term, performance, type
    """

    pf = pq.ParquetFile(path)
    inserted = 0

    for batch in tqdm(
        pf.iter_batches(batch_size=batch_size),
        total=_total_batches(pf, batch_size),
        desc="Importing OntologyTermRating",
    ):
        with transaction.atomic():
            rows = batch.to_pylist()

            # bulk create OntologyTermRating entries
            inserted += len(OntologyTermRating.objects.bulk_create(
                [
                    OntologyTermRating(
                        term=row["term"],
                        performance=row["performance"],
                        type=row["type"],
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
    help = "Import search term parquets into SearchTerm model."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the search term parquet files",
        )
        parser.add_argument(
            "--disease-terms", default="disease_predictions.parquet"
        )
        parser.add_argument(
            "--tissue-terms", default="tissue_predictions.parquet"
        )
        parser.add_argument(
            '--eval-terms', default='eval.parquet',
            help="Parquet file containing evaluations of model performance on ontology terms, which will be imported into OntologyTermRating model (optional)",
        )

        parser.add_argument(
            "--skip-disease-terms",
            action="store_true",
            help="Skip importing disease search terms.",
        )
        parser.add_argument(
            "--skip-tissue-terms",
            action="store_true",
            help="Skip importing tissue search terms.",
        )
        parser.add_argument(
            "--skip-eval-terms",
            action="store_true",
            help="Skip importing eval terms.",
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

        disease_search_terms = root / opts["disease_terms"]
        tissue_search_terms = root / opts["tissue_terms"]

        self.stdout.write(self.style.MIGRATE_HEADING("Starting search term import"))

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(self.style.WARNING("Clearing existing GEO data..."))

                models_to_clear = (
                    SearchTerm,
                    OntologyTermRating,
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )

        # import disease search terms
        if not opts["skip_disease_terms"]:
            self.stdout.write(self.style.HTTP_INFO(f"Importing: {disease_search_terms}"))
            disease_search_terms_inserted = import_search_terms(disease_search_terms, batch_size=500)
            self.stdout.write(self.style.SUCCESS(f"✓ {disease_search_terms_inserted} disease search term(s) imported"))
        else:
            self.stdout.write(self.style.WARNING("Skipping disease search terms import"))
    
        # import tissue search terms
        if not opts["skip_tissue_terms"]:
            self.stdout.write(self.style.HTTP_INFO(f"Importing: {tissue_search_terms}"))
            tissue_search_terms_inserted = import_search_terms(tissue_search_terms, batch_size=500)
            self.stdout.write(self.style.SUCCESS(f"✓ {tissue_search_terms_inserted} tissue search term(s) imported"))
        else:
            self.stdout.write(self.style.WARNING("Skipping tissue search terms import"))

        # import eval terms if provided
        if not opts["skip_eval_terms"]:
            eval_terms_path = root / opts["eval_terms"]
            if eval_terms_path.exists():
                self.stdout.write(self.style.HTTP_INFO(f"Importing: {eval_terms_path}"))
                evals_inserted = import_eval_terms(eval_terms_path, batch_size=500)
                self.stdout.write(self.style.SUCCESS(f"✓ {evals_inserted} eval term(s) imported"))
            else:
                self.stdout.write(self.style.WARNING(f"Eval terms file not found, skipping: {eval_terms_path}"))
        else:
            self.stdout.write(self.style.WARNING("Skipping eval terms import"))

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
