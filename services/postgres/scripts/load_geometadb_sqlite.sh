#!/usr/bin/env bash

SQLITE_DB="${1:-/data/GEOmetadb.sqlite}" 	# path to sqlite file on host
PGCONT="${PGCONT:-pg17}"            		# docker container name
PGDB="${PGDB:-meta2onto}"          	 		# postgres db
PGUSER="${PGUSER:-meta2onto}"

echo "SQLite: $SQLITE_DB"
echo "Postgres: container=$PGCONT db=$PGDB user=$PGUSER"

psql_in_docker() {
  # docker exec -i "$PGCONT" 
  psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 "$@"
}

echo "== Pre-load: truncate + drop non-PK indexes =="
psql_in_docker <<'SQL'
BEGIN;

TRUNCATE api_geosamplemetadata;
TRUNCATE api_geoseriesmetadata;
TRUNCATE api_geoplatformmetadata;

DROP INDEX IF EXISTS api_geoplat_gpl_9f2a0a_idx;
DROP INDEX IF EXISTS api_geoplatformmetadata_gpl_ec20c3c4_like;

DROP INDEX IF EXISTS api_geosamp_gpl_ce7dc2_idx;
DROP INDEX IF EXISTS api_geosamp_gsm_2a3d7a_idx;
DROP INDEX IF EXISTS api_geosamplemetadata_gsm_45e5e687_like;

DROP INDEX IF EXISTS api_geoseri_gse_297173_idx;
DROP INDEX IF EXISTS api_geoseriesmetadata_gse_e4c90565_like;

COMMIT;

-- Keep memory predictable
SET synchronous_commit = off;
SET work_mem = '16MB';
SET maintenance_work_mem = '2GB';
SQL

load_one() {
  local name="$1"
  local sqlite_query="$2"
  local copy_sql="$3"
  local log_tag
  
  log_tag="$(printf '%s' "$name" | LC_ALL=C sed -E 's/[^A-Za-z0-9]+/_/g')"

  echo "== Loading $name (tag: $log_tag) =="

  sqlite3 "$SQLITE_DB" <<SQL \
  | tr -d '\000' \
  | iconv -c -f UTF-8 -t UTF-8 2>/tmp/iconv_${log_tag}.log \
  | psql -U "$PGUSER" -d "$PGDB" -v ON_ERROR_STOP=1 -c "$copy_sql"
.mode csv
.headers off
.nullvalue ""
${sqlite_query};
SQL
}

# gpl -> api_geoplatformmetadata
load_one \
  "gpl -> api_geoplatformmetadata" \
  'SELECT
     gpl,
     title,
     status,
     submission_date,
     last_update_date,
     technology,
     distribution,
     organism,
     manufacturer,
     manufacture_protocol,
     coating,
     catalog_number,
     support,
     description,
     web_link,
     contact,
     CAST(data_row_count AS INTEGER),
     supplementary_file,
     bioc_package
   FROM gpl' \
  "COPY api_geoplatformmetadata (
     gpl,title,status,submission_date,last_update_date,technology,distribution,organism,manufacturer,manufacture_protocol,coating,catalog_number,support,description,web_link,contact,data_row_count,supplementary_file,bioc_package
   )
   FROM STDIN WITH (FORMAT csv, HEADER false, NULL '', QUOTE '\"', ESCAPE '\"');" || exit 2

# gse -> api_geoseriesmetadata
load_one \
  "gse -> api_geoseriesmetadata" \
  'SELECT
     title,
     gse,
     status,
     submission_date,
     last_update_date,
     CAST(pubmed_id AS INTEGER),
     summary,
     type,
     contributor,
     web_link,
     overall_design,
     repeats,
     repeats_sample_list,
     variable,
     variable_description,
     contact,
     supplementary_file
   FROM gse' \
  "COPY api_geoseriesmetadata (
     title,gse,status,submission_date,last_update_date,pubmed_id,summary,type,contributor,web_link,overall_design,repeats,repeats_sample_list,variable,variable_description,contact,supplementary_file
   )
   FROM STDIN WITH (FORMAT csv, HEADER false, NULL '', QUOTE '\"', ESCAPE '\"');" || exit 2

# gsm -> api_geosamplemetadata
load_one \
  "gsm -> api_geosamplemetadata" \
  'SELECT
     gsm,
     title,
     series_id,
     gpl,
     status,
     submission_date,
     last_update_date,
     type,
     source_name_ch1,
     organism_ch1,
     characteristics_ch1,
     molecule_ch1,
     label_ch1,
     treatment_protocol_ch1,
     extract_protocol_ch1,
     label_protocol_ch1,
     source_name_ch2,
     organism_ch2,
     characteristics_ch2,
     molecule_ch2,
     label_ch2,
     treatment_protocol_ch2,
     extract_protocol_ch2,
     label_protocol_ch2,
     hyb_protocol,
     description,
     data_processing,
     contact,
     supplementary_file,
     CAST(data_row_count AS INTEGER),
     CAST(channel_count AS INTEGER)
   FROM gsm' \
  "COPY api_geosamplemetadata (
     gsm,title,series_id,gpl,status,submission_date,last_update_date,type,source_name_ch1,organism_ch1,characteristics_ch1,molecule_ch1,label_ch1,treatment_protocol_ch1,extract_protocol_ch1,label_protocol_ch1,source_name_ch2,organism_ch2,characteristics_ch2,molecule_ch2,label_ch2,treatment_protocol_ch2,extract_protocol_ch2,label_protocol_ch2,hyb_protocol,description,data_processing,contact,supplementary_file,data_row_count,channel_count
   )
   FROM STDIN WITH (FORMAT csv, HEADER false, NULL '', QUOTE '\"', ESCAPE '\"');" || exit 2

echo "== Post-load: analyze =="
psql_in_docker <<'SQL'
ANALYZE api_geoplatformmetadata;
ANALYZE api_geoseriesmetadata;
ANALYZE api_geosamplemetadata;
SQL

echo "== Recreate secondary indexes (optional; match your previous set) =="
psql_in_docker <<'SQL'
-- Recreate what you dropped (names match your existing ones)
CREATE INDEX api_geoplat_gpl_9f2a0a_idx ON api_geoplatformmetadata (gpl);
CREATE INDEX api_geoplatformmetadata_gpl_ec20c3c4_like ON api_geoplatformmetadata (gpl varchar_pattern_ops);

CREATE INDEX api_geosamp_gpl_ce7dc2_idx ON api_geosamplemetadata (gpl);
CREATE INDEX api_geosamp_gsm_2a3d7a_idx ON api_geosamplemetadata (gsm);
CREATE INDEX api_geosamplemetadata_gsm_45e5e687_like ON api_geosamplemetadata (gsm varchar_pattern_ops);

CREATE INDEX api_geoseri_gse_297173_idx ON api_geoseriesmetadata (gse);
CREATE INDEX api_geoseriesmetadata_gse_e4c90565_like ON api_geoseriesmetadata (gse varchar_pattern_ops);
SQL

echo "Done."
