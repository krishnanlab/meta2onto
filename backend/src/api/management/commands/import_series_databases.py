"""
Import GEOSeriesDatabase Parquet dump into normalized Django models.

Expected input file (Parquet format):
  - ids__level-series.parquet

These should all be under the 'root' data folder specified as the one required
CLI argument.
"""

import math
from pathlib import Path
from typing import Iterable, Optional

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import pyarrow.parquet as pq

from api.models import GEOSeriesDatabase

# ============================================================================
# === Utilities
# ============================================================================


def _iter_parquet_rows(
    path: Path, columns: Optional[list[str]] = None
) -> Iterable[dict]:
    """
    Efficiently iterate Parquet rows via row groups to keep memory bounded.
    Yields dicts with Python-native values.
    """
    table = pq.ParquetFile(path)

    for rg in range(table.num_row_groups):
        batch = table.read_row_group(rg, columns=columns).to_pydict()
        keys = list(batch.keys())
        N = len(next(iter(batch.values()), []))

        for i in range(N):
            yield {k: batch[k][i] for k in keys}


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


def import_series_databases(path: Path, batch_size: int = DEFAULT_BATCH_SIZE):
    """
    ids__level-series.parquet
      columns: series, platforms, samples, n_samples, relations, series_type, status

    Column details:
    - "series" is the series ID (GSE).
    - "platforms" and "samples" are "||"-delimited lists of IDs.
    - n_samples is just the number of samples (can be ignored).
    - "relations" is also a "||"-delimited list of <RelationType>:<value> entries;
        depending on the type of the relation, it can be a GEOSeries ID or an external link.
    - "series_type" is a string like "Expression profiling by array"
    - "status" is a string like "Public on YYYY-MM-DD"
    """

    pf = pq.ParquetFile(path)

    db_relations = (
        "BioProject",
        "SRA",
        "ArrayExpress",
        "Peptidome",
    )

    for batch in tqdm(
        pf.iter_batches(batch_size=batch_size),
        total=_total_batches(pf, batch_size),
        desc="Importing GEOSeriesRelations",
    ):
        with transaction.atomic():
            rows = batch.to_pylist()

            for row in rows:
                series_id = row["series"]
                relations = [x for x in str(row["relations"]).split("||") if x]

                for rel in relations:
                    if rel == "NA":
                        continue

                    try:
                        rel_type, rel_value = rel.split(":", 1)
                    except ValueError:
                        print(
                            f"Skipping malformed relation entry for series {series_id}: {rel}",
                            flush=True,
                        )
                        continue

                    if rel_type in db_relations:
                        # create GEOSeriesRelations entry
                        GEOSeriesDatabase.objects.get_or_create(
                            series_id=series_id, database=rel_type, url=rel_value
                        )


# ============================================================================
# === entrypoint
# ============================================================================


class Command(BaseCommand):
    help = "Import ids__level-series.parquet id, relation columns into GEOSeriesDatabase model."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the ids__level-series.parquet file.",
        )
        parser.add_argument("--ids-series", default="ids__level-series.parquet")

        # add an argument to delete all existing data before import?
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Clear existing GEOSeriesDatabase data before import.",
        )

    def handle(self, *args, **opts):
        root = Path(opts["root"]).expanduser().resolve()
        if not root.exists():
            raise CommandError(f"Root folder not found: {root}")

        ids_series = root / opts["ids_series"]

        self.stdout.write(
            self.style.MIGRATE_HEADING("Starting GEOSeriesDatabase import")
        )

        # Order matters:
        # 1. create simple ID->doc mappings from the corpus inputs (corpus__*)
        # 2. process the more complicated (ids__*) relationship inputs, upserting and linking as needed

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(
                    self.style.WARNING("Clearing existing GEOSeriesDatabase data...")
                )

                models_to_clear = (GEOSeriesDatabase,)

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )

                self.stdout.write(self.style.SUCCESS("✓ Existing data cleared."))

        self.stdout.write(self.style.HTTP_INFO(f"Importing: {ids_series}"))
        import_series_databases(ids_series, batch_size=50)
        self.stdout.write(self.style.SUCCESS("✓ ids__level-series imported"))

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
