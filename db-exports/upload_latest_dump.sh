#!/usr/bin/env bash

# copies the latest Meta2Onto database dump to Google Cloud Storage.
# intended to be executed on the host, not in a container.
# user should have gcloud installed and be logged in with appropriate
# permissions for the target project, cuhealthai-sandbox.

BUCKET_PATH="gs://cu-dbmi-meta2onto/meta2onto_latest.dump"

gcloud storage cp meta2onto_latest.dump ${BUCKET_PATH}
gcloud storage objects update ${BUCKET_PATH} --add-acl-grant=entity=allUsers,role=READER

echo "Uploaded latest Meta2Onto database dump to Google Cloud Storage."
