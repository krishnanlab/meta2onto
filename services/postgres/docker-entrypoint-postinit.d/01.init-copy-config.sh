#!/bin/sh
set -e

# only copy it in if /tmp/postgresql.conf exists
if [ -f /tmp/postgresql.conf ] && [ "${PGCONFIG_LOADING}" = "1" ]; then
	echo "* Copying custom postgresql.conf into data directory"
	cp /tmp/postgresql.conf "$PGDATA"/postgresql.conf
fi
