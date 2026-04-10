#!/usr/bin/env bash

# copies the latest Meta2Onto database dump to Google Cloud Storage.
# intended to be executed on the host, not in a container.
# user should have gcloud installed and be logged in with appropriate
# permissions for the target project, cuhealthai-sandbox.

# find and activate the .env file, since we need to read GCP_ACCOUNT from it
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ENV_FILE="$SCRIPT_DIR/../.env"

set -a
source "$ENV_FILE"
set +a

BUCKET_PATH="gs://cu-dbmi-meta2onto/meta2onto_latest.dump"

if [ ! -z "${GCP_ACCOUNT}" ]; then
	GCP_ACCOUNT_ARG="--account=${GCP_ACCOUNT}"
else
	GCP_ACCOUNT_ARG=""
fi

gcloud storage ${GCP_ACCOUNT_ARG} cp meta2onto_latest.dump ${BUCKET_PATH}
gcloud storage ${GCP_ACCOUNT_ARG} objects update ${BUCKET_PATH} --add-acl-grant=entity=allUsers,role=READER

echo "Uploaded latest Meta2Onto database dump to Google Cloud Storage."
