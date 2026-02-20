import io
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import connection, transaction

import pyarrow.parquet as pq
import pyarrow.csv as pacsv
import pyarrow.compute as pc

from api.models import SearchTerm


class Command(BaseCommand):
    help = "Import SearchTerm rows from a Parquet file using PostgreSQL COPY"

    def add_arguments(self, parser):
        parser.add_argument(
            "parquet_path", help="Path to meta2onto_example_predictions.parquet"
        )
        parser.add_argument(
            "--table",
            default=SearchTerm._meta.db_table,
            help="Target DB table name (default: SearchTerm._meta.db_table)",
        )

    def handle(self, *args, **options):
        parquet_path = Path(options["parquet_path"])
        table_name = options["table"]

        # first, truncate SearchTerm
        self.stdout.write(f"Truncating table {table_name} ...")
        with connection.cursor() as cursor:
            cursor.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE;")
        self.stdout.write(self.style.SUCCESS(f"Table {table_name} truncated."))

        # 1) Read Parquet
        self.stdout.write(f"Reading Parquet file: {parquet_path}")
        table = pq.read_table(parquet_path)

        # 2) Select and rename columns to match DB schema
        # Parquet: term, ID, prob, log2(prob/prior), related_words
        # DB:      term, sample_id, prob, log2_prob_prior, related_words
        table = table.select(
            ["term", "ID", "prob", "log2(prob/prior)", "related_words"]
        )
        table = table.rename_columns(
            ["term", "sample_id", "prob", "log2_prob_prior", "related_words"]
        )

        # # If ID might be missing / null, ensure it's numeric or null
        # # (Arrow usually infers this correctly; adjust if needed)
        # if table["sample_id"].type not in (pc.field("dummy", pc.int64()).type,):
        #     # Try to cast to int64; errors='ignore' will produce nulls for bad values
        #     table = table.set_column(
        #         table.schema.get_field_index("sample_id"),
        #         "sample_id",
        #         pc.cast(table["sample_id"], pc.int64()),
        #     )

        # 3) Write to an in-memory CSV with header
        self.stdout.write("Converting Arrow table to CSV in memory...")
        buf = io.BytesIO()
        pacsv.write_csv(table, buf)
        buf.seek(0)

        # 4) COPY into PostgreSQL using psycopg3's copy()
        self.stdout.write(f"Copying into table {table_name} ...")
        cols = ["term", "sample_id", "prob", "log2_prob_prior", "related_words"]
        copy_sql = f"""
            COPY {table_name} ({", ".join(cols)})
            FROM STDIN WITH (FORMAT csv, HEADER true)
        """

        # buf is bytes; psycopg3 Copy.write() accepts bytes for text/binary COPY
        with transaction.atomic():
            with connection.cursor() as cursor:
                with cursor.copy(copy_sql) as copy:  # <-- psycopg3 API
                    while True:
                        chunk = buf.read(1024 * 1024)  # 1 MB chunks
                        if not chunk:
                            break
                        copy.write(chunk)

        self.stdout.write(self.style.SUCCESS("Import completed successfully."))
