#!/usr/bin/env bash

# FYI, this script should be run within the db container

PARQUET_DIR="${1:-/data/search_tables}" 	# path to folder w/parquet files in container
PGDB="${PGDB:-meta2onto}"          	 		# postgres db
PGUSER="${PGUSER:-meta2onto}"

# if 1, will install dependencies (curl, duckdb) in the container
INSTALL_DEPS=${INSTALL_DEPS:-0}

if [ "$INSTALL_DEPS" -eq 1 ]; then
  echo "Installing dependencies (curl, duckdb) in the container..."
  apt-get update && apt-get install -y curl && \
  curl https://install.duckdb.org | sh && \
  export PATH="~/.duckdb/cli/latest":$PATH
fi

echo "Parquet folder: $PARQUET_DIR"
echo "Postgres: db=$PGDB user=$PGUSER"

psql_exec() {
  psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 "$@"
}

# =========================================================================
# === pre-load preparation
# =========================================================================

echo "== Pre-load: truncate + drop non-PK indexes =="
psql_exec <<'SQL'
BEGIN;

TRUNCATE api_searchterm;

DROP INDEX IF EXISTS api_searchterm_series_id_7c3a389e;
DROP INDEX IF EXISTS api_searcht_term_0195b4_idx;
DROP INDEX IF EXISTS term_related_words_trgm_gin;
DROP INDEX IF EXISTS api_searchterm_series_id_7c3a389e_like;

COMMIT;

-- Keep memory predictable
SET synchronous_commit = off;
SET work_mem = '16MB';
SET maintenance_work_mem = '2GB';
SQL

# =========================================================================
# === actual data loading
# =========================================================================

pushd "$PARQUET_DIR" || exit 1

echo "* Loading disease_predictions.parquet into api_searchterm..."

time (
duckdb -c "
COPY (
SELECT term, confidence, related_words, id
FROM read_parquet('disease_predictions.parquet')
) TO STDOUT (FORMAT CSV, HEADER false)
" \
| psql -U "$PGUSER" -d "$PGDB" -c "
COPY api_searchterm (
term, confidence, related_words, series_id
) FROM STDIN WITH (FORMAT csv, NULL '', QUOTE '\"', ESCAPE '\"');
"
)

echo "* Loading tissue_predictions.parquet into api_searchterm..."

time (
duckdb -c "
COPY (
  SELECT term, confidence, related_words, id
  FROM read_parquet('tissue_predictions.parquet')
) TO STDOUT (FORMAT CSV, HEADER false)
" \
| psql -U "$PGUSER" -d "$PGDB" -c "
COPY api_searchterm (
  term, confidence, related_words, series_id
) FROM STDIN WITH (FORMAT csv, NULL '', QUOTE '\"', ESCAPE '\"');
"
)

popd

# =========================================================================
# === post-load operations
# =========================================================================

echo "== Post-load: analyze =="
psql_exec <<'SQL'
ANALYZE api_searchterm;
SQL

time (
echo "== Recreate secondary indexes (this can take a while, ~30 minutes+) =="
psql_exec <<'SQL'
-- Recreate what you dropped (names match your existing ones)
CREATE INDEX api_searchterm_series_id_7c3a389e ON api_searchterm (series_id);
CREATE INDEX api_searcht_term_0195b4_idx ON api_searchterm (term);
--- these indices are unused and very expensive to generate, so they're commented out for now
-- CREATE INDEX term_related_words_trgm_gin ON api_searchterm using gin (related_words gin_trgm_ops);
-- CREATE INDEX api_searchterm_series_id_7c3a389e_like ON api_searchterm (series_id varchar_pattern_ops);
SQL
)

echo "Done."
