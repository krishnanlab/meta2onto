"""
Imports the ontology terms db from meta-hq, a DuckDB database, into the database.
"""

from pathlib import Path

from tqdm import tqdm

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction, connection

import duckdb

from api.models import (
    OntologySearchDocs,
    OntologySynonyms,
    OntologyTerms,
)

# ============================================================================
# === entrypoint
# ============================================================================

class Command(BaseCommand):
    help = "Import ontology search tables from meta-hq into meta2onto models."

    def add_arguments(self, parser):
        parser.add_argument(
            "--root",
            required=True,
            help="Directory containing the ontology_search.duckdb file"
        )
        parser.add_argument("--ontology-search-db", default="ontology_search.duckdb")

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

        ontology_search_db = root / opts["ontology_search_db"]

        self.stdout.write(self.style.MIGRATE_HEADING("Starting ontology term import"))

        if opts["clear_existing"]:
            with transaction.atomic():
                self.stdout.write(self.style.WARNING("Clearing existing ontology search data..."))

                models_to_clear = (
                    OntologySearchDocs,
                    OntologySynonyms,
                    OntologyTerms
                )

                with connection.cursor() as cursor:
                    cursor.execute(
                        "TRUNCATE TABLE {} RESTART IDENTITY CASCADE;".format(
                            ", ".join(f'"{t._meta.db_table}"' for t in models_to_clear)
                        )
                    )
                
        # this one's simpler, just rows consisting of (sample, series, platform, organism, status)
        self.stdout.write(self.style.HTTP_INFO(f"Importing: {ontology_search_db}"))

        con = duckdb.connect(database=str(ontology_search_db), read_only=True)

        # OntologySearchDocs
        self.stdout.write(self.style.HTTP_INFO("→ Importing OntologySearchDocs..."))
        rows = con.execute("SELECT term_id, ontology, type, name, syn_exact, syn_narrow, syn_broad, syn_related FROM ontology_search_docs").fetchall()
        OntologySearchDocs.objects.bulk_create([
            OntologySearchDocs(
                term_id=row[0],
                ontology=row[1],
                type=row[2],
                name=row[3],
                syn_exact=row[4],
                syn_narrow=row[5],
                syn_broad=row[6],
                syn_related=row[7],
            ) for row in tqdm(rows)
        ], ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS("✓ OntologySearchDocs imported"))

        # OntologySynonyms
        self.stdout.write(self.style.HTTP_INFO("→ Importing OntologySynonyms..."))
        rows = con.execute("SELECT term_id, synonym, scope FROM ontology_synonyms").fetchall()
        OntologySynonyms.objects.bulk_create([
            OntologySynonyms(
                term_id=row[0],
                synonym=row[1],
                scope=row[2],
            ) for row in tqdm(rows)
        ], ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS("✓ OntologySynonyms imported"))

        # OntologyTerms
        self.stdout.write(self.style.HTTP_INFO("→ Importing OntologyTerms..."))
        rows = con.execute("SELECT id, name, ontology, type FROM ontology_terms").fetchall()
        OntologyTerms.objects.bulk_create([
            OntologyTerms(
                id=row[0],
                name=row[1],
                ontology=row[2],
                type=row[3],
            ) for row in tqdm(rows)
        ], ignore_conflicts=True)
        self.stdout.write(self.style.SUCCESS("✓ OntologyTerms imported"))

        self.stdout.write(self.style.MIGRATE_HEADING("Import complete"))
