#!/bin/bash

# this script should be run from within the postgres container
# by default, this script is mounted to /opt/scripts/load_omicidx_geo_duckdb.sh

# execute duckdb with the SQL file
# we run it through envsubst to replace, e.g., pg connection vars with env vars
# (these should be set in the container environment, e.g., via docker-compose)
rm -f temp.db
mkdir -p /tmp/duckdb_tmp
envsubst < ./resources/load_geo.template.sql > /tmp/load_geo.sql

# actually run the load/diagnostic SQL script
duckdb -c ".read /tmp/load_geo.sql"
