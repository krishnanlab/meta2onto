"""
Convert a Sqlite database to DuckDB database.

Requires the Python duckdb package.

Can be invoked as a script:
    python sqlite2duckdb.py path/to/sqlite.db path/to/duckdb.db [--tables table1,table2,...]

The optional --tables argument specifies a comma-separated list of specific
tables to copy. If not provided, all tables will be copy.
"""

import duckdb
import os
import time
import sqlite3


def sanitize_value(value):
    """Sanitize a value by removing invalid unicode sequences."""
    if value is None:
        return None
    if isinstance(value, bytes):
        # Decode bytes with error replacement to handle invalid UTF-8
        return value.decode('utf-8', errors='replace')
    if isinstance(value, str):
        # Encode to bytes with 'replace' to remove invalid sequences, then decode back
        return value.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    return str(value)


def sqlite_to_duckdb(sqlite_db: str, duck_db: str, copy_tables: str = None):
    print(f"Create {duck_db} databases")

    if not os.path.exists(sqlite_db):
        raise Exception(f"File {sqlite_db} doesn't exists")

    # Remove target db if exists
    if os.path.exists(duck_db):
        raise Exception(f"Database {duck_db} already exists")

    # Create databases

    start_time = time.perf_counter()
    conn = duckdb.connect(duck_db)
    db_name = conn.sql("SELECT database_name FROM duckdb_databases").fetchone()[0]

    ## Install sqlite
    conn.sql(
        f"""
    INSTALL sqlite;
    LOAD sqlite;
    ATTACH '{sqlite_db}' as __other;
    """
    )

    ## Get sqlite Names
    conn.sql("USE __other")
    tables = [i[0] for i in conn.sql("SHOW tables").fetchall()]
    print(f"{len(tables)} tables found(s)")
    conn.sql(f"USE {db_name}")

    # Create tables
    for table in tables:
        if copy_tables and table not in copy_tables.split(","):
            print(f"Skip duckdb table {table}")
            continue
        print(f"Create duckdb table {table}")
        try:
            # First try direct copy
            conn.sql(f"CREATE TABLE {table} AS select * FROM __other.{table}")
        except Exception as e:
            # If direct copy fails due to unicode issues, use sanitized approach
            if "unicode" in str(e).lower() or "Invalid Input Error" in str(e):
                print(f"  → Direct copy failed, using sanitized approach...", flush=True)
                sqlite_conn = sqlite3.connect(sqlite_db)
                # Use bytes factory to avoid UTF-8 decoding errors
                sqlite_conn.text_factory = bytes
                
                # Get schema and data from SQLite
                schema = sqlite_conn.execute(f"PRAGMA table_info({table})").fetchall()
                # Decode column names and types from bytes
                column_info = [
                    (col[1].decode('utf-8') if isinstance(col[1], bytes) else col[1],
                     col[2].decode('utf-8') if isinstance(col[2], bytes) else col[2])
                    for col in schema
                ]  # (name, type)

                # Create table in DuckDB
                col_def = ", ".join(f'"{col[0]}" {col[1]}' for col in column_info)
                conn.sql(f"CREATE TABLE {table} ({col_def})")

                print(f"  → Table {table} created...", flush=True)
                
                print(f"  → About to fetch rows...", flush=True)
                result = sqlite_conn.execute(f"SELECT * FROM {table}")

                total_rows = 0

                # using fetchmany, fetch CHUNK_SIZE rows at a time and insert them to avoid memory usage
                CHUNK_SIZE = 1000
                
                # get the initial set, then loop
                rows = result.fetchmany(CHUNK_SIZE)
                while rows:
                    total_rows += len(rows)
                    
                    # Insert sanitized data
                    sanitized_rows = [
                        tuple(sanitize_value(val) for val in row)
                        for row in rows
                    ]
                    placeholders = ", ".join("?" * len(column_info))
                    col_names = ", ".join(f'"{col[0]}"' for col in column_info)
                    
                    insert_sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"
                    conn.executemany(insert_sql, sanitized_rows)

                    print(f"    → Inserted {total_rows} rows so far...", flush=True)

                    rows = result.fetchmany(CHUNK_SIZE)


                print(f"  ✓ Table {table} inserted {total_rows} rows with sanitization, about to close connection", flush=True)
                
                sqlite_conn.close()
                print(f"  ✓ {total_rows} rows inserted with sanitization", flush=True)

            else:
                print(f"  ✗ Failed to copy table {table}: {e}", flush=True)
                raise e

    conn.sql(f"DETACH __other")
    conn.close()
    end_time = time.perf_counter()
    execution_time = (end_time - start_time) * 1000
    print(f"Done in {execution_time:.2f} ms !")

if __name__ == "__main__":
    # take sqlite db path and duckdb path as input arguments
    import argparse
    parser = argparse.ArgumentParser(description="Convert Sqlite database to DuckDB database")
    parser.add_argument("sqlite_db", type=str, help="Path to the input Sqlite database")
    parser.add_argument("duck_db", type=str, help="Path to the DuckDB database to create")

    # optional argument to specify specific tables to convert (comma-separated)
    parser.add_argument(
        "--tables",
        type=str,
        help="Comma-separated list of tables to convert (default: all tables)",
        default=None
    )

    args = parser.parse_args()

    sqlite_db = args.sqlite_db
    duck_db = args.duck_db

    sqlite_to_duckdb(sqlite_db, duck_db, copy_tables=args.tables)
