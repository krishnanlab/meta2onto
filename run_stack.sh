#!/usr/bin/env bash

# this script uses the docker-compose.yml file to do the following:
# - create a .env file from .env.TEMPLATE, but prepopulated with random secrets
# - load the .env file, so it can be used here and in docker-compose files
# - identify the target environment (dev or prod) based on the first arg
#   - "dev": uses compose-envs/docker-compose.dev.yml
#   - "prod": uses compose-envs/docker-compose.prod.yml
#   - if no arg is given, defaults to DEFAULT_ENV from .env or, failing that, "dev"
# - build any required images, then run the stack's services

set -euo pipefail

# if 1, skips interactive prompts
NONINTERACTIVE=${NONINTERACTIVE:-"0"}

# ================================================================
# == set up .env file
# ================================================================

# helper that replaces an environment variable in .env with a random secret if it is missing
# args:
#  $1: the environment variable name to check
#  $2: the length of the random secret to generate (default: 16)
replace_env_var_with_secret() {
    local field="$1"
    local length="${2:-16}"
    if grep -q -e "^${field}=$" .env; then
        echo "Filling in missing ${field} value in .env"
        sed -E "s|^(${field}=)(.*)|\1$(openssl rand -hex ${length})|g" .env > .env.tmp
        mv .env.tmp .env
    fi
}

# if .env doesn't exist, copy it from .env.TEMPLATE
if [ ! -f .env ]; then
    cp .env.TEMPLATE .env
    echo "Created .env file from .env.TEMPLATE"
fi

# replace any missing secret environment variables with random secrets
replace_env_var_with_secret POSTGRES_PASSWORD
replace_env_var_with_secret DJANGO_ADMIN_PASSWORD 12
replace_env_var_with_secret DJANGO_SECRET_KEY 32

# load contents of .env into the environment
set -a
source .env
set +a

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

# ================================================================
# == determine environment (i.e., which compose files to use)
# ================================================================

ENV=${DEFAULT_ENV:-"dev"}
COMPOSE_ARGS="--build -d --remove-orphans"
COMPOSE_POST_CMD="docker compose logs -f --since=1s"

# if the first arg is in "dev", "prod", use that as the environment
if [ "$#" -gt 0 ] && [[ "$1" == "dev" || "$1" == "prod" ]]; then
    ENV="$1"
    shift  # remove the first arg so that any remaining args can be passed to docker compose
fi

echo "* Using environment: $ENV"

# set the compose files to use based on the environment
case "$ENV" in
    dev)
        COMPOSE_FILES="-f docker-compose.yml -f compose-envs/docker-compose.dev.yml"
        # remain attached and don't thus don't tail after
        COMPOSE_ARGS="--build"
        COMPOSE_POST_CMD=":"
        ;;
    prod)
        COMPOSE_FILES="-f docker-compose.yml -f compose-envs/docker-compose.prod.yml"
        ;;
    *)
        echo "Error: unknown environment '$ENV'. Supported environments are 'dev' and 'prod'."
        exit 1
        ;;
esac

# ================================================================
# == launch the stack
# ================================================================

if [ "$#" -gt 0 ]; then
    # if any args are supplied, run docker compose with them
    docker compose ${COMPOSE_FILES} $@
else
    # otherwise, build the stack, run it, and do COMPOSE_POST_CMD
    # (typically, tailing the logs forever)
    docker compose ${COMPOSE_FILES} up ${COMPOSE_ARGS} && \
    ${COMPOSE_POST_CMD:-true}
fi
