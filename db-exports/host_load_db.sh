#!/usr/bin/env bash

# this script is intended to be run from the host machine, not inside a container

# it does the following:
# 1. brings down any running containers in the stack
# 2. starts the database container with a load-optimized configuration
# 3. loads meta2onto_latest.dump from the /db-exports/ directory
# 4. brings down the database container

# check if we're in a container and abort if so
if [ -f "/.dockerenv" ]; then
	echo "Error: This script should be run from the host, not inside a container."
	exit 1
fi

# move to the repo root to reference config files
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "${SCRIPT_DIR}/.."

# bring down any running containers
docker compose down

# purge the database volume
docker volume rm meta2onto_postgres_data
# start the database container with a load-optimized configuration
# (this will block until the load is complete)
time (
	if [ ${$HOSTNAME} = "meta2onto-api" ]; then
		# use a config optimized for an e2-medium
		export PGCONFIG_PATH="./services/postgres/configs/postgresql_load_e2-med.conf"
	else
		# use the regular optimized loader
		export PGCONFIG_PATH="./services/postgres/configs/postgresql_load.conf"
	fi

	docker compose run --rm -it \
		-v ${PGCONFIG_PATH}:/etc/postgresql/postgresql.conf \
		db
)

# when it's done, bring down the stack again
docker compose down
