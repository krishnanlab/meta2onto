#!/usr/bin/env bash

# this script is used to load the database from a dump file on the host machine.
# it uses optimized settings for loading the database, which are different from
# the settings used for running the database in production.

# the script does the following:
# 1. brings down any running containers in the stack
# 2. starts the database container with a load-optimized configuration
# 3. loads meta2onto_latest.dump from the /db-exports/ directory
# 4. brings down the database container

# this script is intended to be run from the host machine, not inside a container

set -euo pipefail

# if 1, skips interactive prompts
NONINTERACTIVE=${NONINTERACTIVE:-"0"}

# check if we're in a container and abort if so
if [ -f "/.dockerenv" ]; then
	echo "Error: This script should be run from the host, not inside a container."
	exit 1
fi

# move to the repo root to reference config files
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "${SCRIPT_DIR}/.."

# ================================================================
# == obtain database dump to initialize db
# ================================================================

# Converts bytes value to human-readable string [$1: bytes value]
# from https://unix.stackexchange.com/a/259254
bytesToHumanReadable() {
    local i=${1:-0} d="" s=0 S=("Bytes" "KiB" "MiB" "GiB" "TiB" "PiB" "EiB")
    while ((i > 1024 && s < ${#S[@]}-1)); do
        printf -v d ".%02d" $((i % 1024 * 100 / 1024))
        i=$((i / 1024))
        s=$((s + 1))
    done
    echo "$i$d ${S[$s]}"
}

LATEST_DUMP_URL="https://storage.googleapis.com/cu-dbmi-meta2onto/meta2onto_latest.dump"

LAST_DUMP_FILENAME=$( basename "${LATEST_DUMP_URL}" )
TARGET_DB_DUMP="./db-exports/${LAST_DUMP_FILENAME}"

REMOTE_FILE_SIZE=$( curl -sI "${LATEST_DUMP_URL}" | grep -i '^Content-Length:' | awk '{print $2}' | tr -d '\r\n' )
LOCAL_FILE_SIZE=$(wc -c < "$TARGET_DB_DUMP" 2>/dev/null || echo 0)

# if the local dump either doesn't exist or doesn't match the remote's file size, download it
if [ ! -f "${TARGET_DB_DUMP}" ] || [ "${REMOTE_FILE_SIZE}" -ne "${LOCAL_FILE_SIZE}" ]; then
        # if we're in interactive mode, confirm before downloading
        if [ "${NONINTERACTIVE}" -eq 0 ]; then
                read -p "* A new database dump is available; it will require $( bytesToHumanReadable ${REMOTE_FILE_SIZE} ) of space. Download it now? (y/n) " yn
                case $yn in
                        [Yy]* )
                                echo "* Downloading latest database dump from ${LATEST_DUMP_URL}..."
                                mkdir -p ./db-exports/
                                time curl -o "./db-exports/${LAST_DUMP_FILENAME}" -L "${LATEST_DUMP_URL}"
                                ;;
                        * )
                                echo "* Skipping database dump download"
                esac
        else
                echo "* Non-interactive mode: downloading latest database dump from ${LATEST_DUMP_URL}..."
                mkdir -p ./db-exports/
                time curl -o "./db-exports/${LAST_DUMP_FILENAME}" -L "${LATEST_DUMP_URL}"
        fi
fi

# bring down any running containers
docker compose down

# purge the database volume
docker volume rm meta2onto_postgres_data 2>/dev/null || true

# start the database container with a load-optimized configuration
# (this will block until the load is complete)
time (
	if [[ "${HOSTNAME}" = "meta2onto-api" ]]; then
		# use a config optimized for an e2-medium
		export PGCONFIG_PATH="./services/postgres/configs/postgresql_load_e2-med.conf"
	else
		# use the regular optimized loader
		export PGCONFIG_PATH="./services/postgres/configs/postgresql_load.conf"
	fi

	echo "* Loading database from dump file using config: ${PGCONFIG_PATH}"

	docker compose run --rm -it \
		-v ${PGCONFIG_PATH}:/opt/postgresql.conf \
		db \
		postgres -c config_file=/opt/postgresql.conf
)

# when it's done, bring down the stack again
docker compose down

echo "* Database load complete. You can now start the stack with ./run_stack.sh"