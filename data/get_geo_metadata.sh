#!/usr/bin/env bash

# pulls the geo_metadata parquet files from the GCS bucket and places them in /data/geo_metadata/
# the script presumes you've already authenticated with gcloud and have access to the bucket

# get the location of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# cd to the root directory of the project
cd "${SCRIPT_DIR}/.."

DATA_DIR=${DATA_DIR:-"./data/geo_metadata/"}

echo "Downloading geo_metadata parquet files to ${DATA_DIR} ..."
mkdir -p ${DATA_DIR}

gcloud storage cp --no-clobber --recursive 'gs://meta2onto-staging/geo_metadata/*' ${DATA_DIR}
