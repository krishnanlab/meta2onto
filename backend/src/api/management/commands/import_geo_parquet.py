"""
Import GEO Parquet dumps into normalized Django models.

DEPRECATION: this script is deprecated in favor of importing the data from
GEOmetadb. expect this script to be removed once the transition is complete.

Expected input files (Parquet format):
  - ids__level-sample.parquet
  - ids__level-series.parquet
  - corpus__level-sample.parquet
  - corpus__level-series.parquet

These should all be under the 'root' data folder specified as the one required
CLI argument.

There are three main entities represented:
- GEOSample (GSM)
- GEOSeries (GSE)
- GEOPlatform (GPL)

The "ids__level-*.parquet" files contain structured metadata and relationships
between these entities, while the "corpus__level-*.parquet" files contain
textual documents associated with each GEOSample or GEOSeries for indexing/search.

GEOPlatforms and Organisms are created as needed. GEOSeries-GEOPlatform relationships,
GEOSample-GEOSeries memberships, GEOSeries-GEOSeries relations, and external links are also
created based on the data in the Parquet files.
"""

import json
import math
import re
from pathlib import Path
from typing import Iterable, Tuple, Optional

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import pyarrow as pa
import pyarrow.parquet as pq
from django.utils.dateparse import parse_datetime

from api.models import (
    GEOSample, GEOSeries, GEOPlatform, Organism,
    OrganismForPairing, GEOSeriesRelations
)

# ============================================================================
# === Utilities
# ============================================================================

def _iter_parquet_rows(path: Path, columns: Optional[list[str]] = None) -> Iterable[dict]:
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
    total_rows = sum(pf.metadata.row_group(i).num_rows for i in range(pf.num_row_groups))
    return math.ceil(total_rows / batch_size)

# ============================================================================
# === Importers
# ============================================================================

# size of batches to process at a time
DEFAULT_BATCH_SIZE = 5000

@transaction.atomic
def import_corpus_level_sample(path: Path, batch_size:int = DEFAULT_BATCH_SIZE):
    """
    corpus__level-sample.parquet
      columns: index (sample_id), docs
    """

    pf = pq.ParquetFile(path)

    for batch in tqdm(pf.iter_batches(batch_size=batch_size), total=_total_batches(pf, batch_size), desc="Importing GEOSample"):
        rows = batch.to_pylist()
        GEOSample.objects.bulk_create([
            GEOSample(sample_id=row['index'], doc=row['doc']) for row in rows
        ], ignore_conflicts=True)

@transaction.atomic
def import_corpus_level_series(path: Path, batch_size: int = DEFAULT_BATCH_SIZE):
    """
    corpus__level-series.parquet
      columns: index (series_id), docs
    """

    pf = pq.ParquetFile(path)

    for batch in tqdm(pf.iter_batches(batch_size=batch_size), total=_total_batches(pf, batch_size), desc="Importing GEOSeries"):
        rows = batch.to_pylist()
        GEOSeries.objects.bulk_create([
            GEOSeries(series_id=row['index'], doc=row['doc']) for row in rows
        ], ignore_conflicts=True)

def import_ids_level_sample(path: Path, batch_size: int = DEFAULT_BATCH_SIZE):
    """
    ids__level-sample.parquet
      columns: sample, series, platform, organism, status

    Column details:
    - "sample": GSM ID
    - "series": GSE ID
    - "platform": GPL ID
    - "organism": organism name
    - "status": e.g., 'Public on YYYY-MM-DD'
    """

    pf = pq.ParquetFile(path)

    # store refs to already-created organisms to avoid redundant queries
    organism_cache = {}
    # store IDs of already-created platforms to avoid redundant queries
    platform_set = set()
    sample_set = set()
    series_set = set()

    for batch in tqdm(pf.iter_batches(batch_size=batch_size), total=_total_batches(pf, batch_size), desc="Importing OrganismForPairing"):
        with transaction.atomic():
            rows = batch.to_pylist()

            for row in rows:
                # check if the organism exists; create if not and cache the model instance
                if row["organism"] not in organism_cache:
                    organism, _ = Organism.objects.get_or_create(name=row["organism"])
                    organism_cache[row["organism"]] = organism

                # check if the platform exists; create if not
                if row["platform"] not in platform_set:
                    platform_set.add(row["platform"])
                    # use get_or_create rather than create just in case it's already there
                    GEOPlatform.objects.get_or_create(platform_id=row["platform"])

                # check if the sample exists; create if not
                if row["sample"] not in sample_set:
                    sample_set.add(row["sample"])
                    GEOSample.objects.get_or_create(sample_id=row["sample"])

                # check if the GEOSeries exists; create if not
                if row["series"] not in series_set:
                    series_set.add(row["series"])
                    GEOSeries.objects.get_or_create(series_id=row["series"])

            OrganismForPairing.objects.bulk_create([
                OrganismForPairing(
                    sample_id=row["sample"],
                    series_id=row["series"],
                    platform_id=row["platform"],
                    organism=organism_cache[row["organism"]]
                ) for row in rows
            ], ignore_conflicts=True)

def import_ids_level_series(path: Path, batch_size: int = DEFAULT_BATCH_SIZE):
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

    # presumably at this point all the possible GEOSamples and GEOPlatforms already exist

    # get refs to the through models so we can bulk_create into them
    GEOSamplesThrough = GEOSeriesRelations.samples.through
    GEOPlatformsThrough = GEOSeriesRelations.platforms.through

    # delete existing GEOSeriesRelations to avoid conflicts
    GEOSeriesRelations.objects.all().delete()

    for batch in tqdm(pf.iter_batches(batch_size=batch_size), total=_total_batches(pf, batch_size), desc="Importing GEOSeriesRelations"):
        with transaction.atomic():
            rows = batch.to_pylist()

            for row in rows:
                rel, _ = GEOSeriesRelations.objects.get_or_create(series_id=row['series'])
                sample_ids = [x for x in str(row["samples"]).split("||") if x]
                platform_ids = [x for x in str(row["platforms"]).split("||") if x]

                # ensure each GEOSample and GEOPlatform exists
                for sid in sample_ids:
                    GEOSample.objects.get_or_create(sample_id=sid)

                for pid in platform_ids:
                    GEOPlatform.objects.get_or_create(platform_id=pid)

                GEOSamplesThrough.objects.bulk_create(
                    [
                        GEOSamplesThrough(
                            seriesrelations_id=rel.id, sample_id=sid
                        )
                        for sid in set(sample_ids)
                    ],
                    ignore_conflicts=True,
                )
                GEOPlatformsThrough.objects.bulk_create(
                    [
                        GEOPlatformsThrough(
                            seriesrelations_id=rel.id, platform_id=pid
                        )
                        for pid in set(platform_ids)
                    ],
                    ignore_conflicts=True,
                )

# ============================================================================
# === entrypoint
# ============================================================================

class Command(BaseCommand):
    help = "Import GEO Parquet dumps into normalized Django models."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the four Parquet files."
        )
        parser.add_argument("--ids-sample", default="ids__level-sample.parquet")
        parser.add_argument("--ids-series", default="ids__level-series.parquet")
        parser.add_argument("--corpus-sample", default="corpus__level-sample.parquet")
        parser.add_argument("--corpus-series", default="corpus__level-series.parquet")
        parser.add_argument("--skip-ids-sample", action="store_true")
        parser.add_argument("--skip-ids-series", action="store_true")
        parser.add_argument("--skip-corpus-sample", action="store_true")
        parser.add_argument("--skip-corpus-series", action="store_true")

        # add an argument to delete all existing data before import?
        parser.add_argument(
            "--clear-existing",
            action="store_true",
            help="Clear existing GEO data before import."
        )

    def handle(self, *args, **opts):
        root = Path(opts["root"]).expanduser().resolve()
        if not root.exists():
            raise CommandError(f"Root folder not found: {root}")

        ids_sample = root / opts["ids_sample"]
        ids_series = root / opts["ids_series"]
        corpus_sample = root / opts["corpus_sample"]
        corpus_series = root / opts["corpus_series"]

        self.stdout.write(self.style.MIGRATE_HEADING("Starting GEO import"))

        # Order matters:
        # 1. create simple ID->doc mappings from the corpus inputs (corpus__*)
        # 2. process the more complicated (ids__*) relationship inputs, upserting and linking as needed

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(self.style.WARNING("Clearing existing GEO data..."))

                models_to_clear = (
                    OrganismForPairing,
                    GEOSeriesRelations,
                    GEOSample,
                    GEOSeries,
                    GEOPlatform,
                    Organism,
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )

                self.stdout.write(self.style.SUCCESS("✓ Existing data cleared."))

        if not opts["skip_corpus_sample"]:
            self.stdout.write(self.style.HTTP_INFO(f"Importing: {corpus_sample}"))
            import_corpus_level_sample(corpus_sample)
            self.stdout.write(self.style.SUCCESS("✓ corpus__level-sample imported"))

        if not opts["skip_corpus_series"]:
            self.stdout.write(self.style.HTTP_INFO(f"Importing: {corpus_series}"))
            import_corpus_level_series(corpus_series)
            self.stdout.write(self.style.SUCCESS("✓ corpus__level-series imported"))

        # this one's simpler, just rows consisting of (sample, series, platform, organism, status)
        if not opts["skip_ids_sample"]:
            self.stdout.write(self.style.HTTP_INFO(f"Importing: {ids_sample}"))
            import_ids_level_sample(ids_sample, batch_size=50)
            self.stdout.write(self.style.SUCCESS("✓ ids__level-sample imported"))

        # this one's more complex, with lists and relations
        if not opts["skip_ids_series"]:
            self.stdout.write(self.style.HTTP_INFO(f"Importing: {ids_series}"))
            import_ids_level_series(ids_series, batch_size=50)
            self.stdout.write(self.style.SUCCESS("✓ ids__level-series imported"))

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
