#!/bin/bash
set -e

# only copy it in if /opt/alt-configs/postgresql_load.conf exists
if [ -f /opt/alt-configs/postgresql_load.conf ] && [ "${PGCONFIG_LOADING}" = "1" ]; then
	echo "* Copying custom postgresql.conf into data directory"
	cp /opt/alt-configs/postgresql_load.conf "$PGDATA"/postgresql.conf
fi
