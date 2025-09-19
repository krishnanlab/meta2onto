# Data Staging Folder

The contents of this folder are used to stage data files that are needed to
build the meta2onto datatabase.

The data is currently stored in the private bucket `gs://meta2onto-staging/geo_metadata`; ask
an admin if you'd like access.

## Downloading Data

To download the data, you can use the `gcloud storage` command line tool. For example:

```bash
gcloud storage cp --recursive gs://meta2onto-staging/geo_metadata .
```

## Importing into PostgreSQL

Data is loaded from `/data/geo_metadata/` during the initialization of the
PostgreSQL database, as defined in `services/postgres/init-db.d/`. If you
make changes to the data files, you will need to remove the `pgdata` volume
and restart the stack to allow the loader to rerun and reimport the data.

## Notes from PH

In `geo_metadata` there are the following files:

- `corpus__level-sample.parquet`
  - 7,287,815 sample descriptions from GEO (a database we made predictions on).
  - There are two columns, `index` and `docs`. The `index` column stores a sample-level ID and `docs` stores the sample’s free-text description that will be displayed
- `corpus__level-series.parquet`
  - 253,569 series (dataset) descriptions from GEO.
  - Has the same two columns as the sample-level, except `index` has dataset IDs instead of sample-level IDs.
- `ids__level-sample.parquet`
  - 9,295,479 entries of sample, study, platform IDs.
  - Has five columns `sample` storing sample-level IDs, `series` storing dataset IDs, `platform` storing instrument IDs, `organism`, and `status` noting - when the sample was added.
  - You’ll notice that there are ~2M more entries here than in the sample-level corpus. This is because samples can belong to multiple datasets/series. Collections that use a subset of existing samples from another study are called subseries. The larger collection is called the - superseries.
- `ids__level-series.parquet`
  - 253,569 series descriptions from GEO.
  - Has columns `series` storing dataset IDs, `platforms` showing all platforms used in that series, `samples` lists the sample IDs belonging to the series, `n_samples`, `relations` denoting links to the same series in another database (e.g., BioProject) or relationships to other series IDs (e.g., `SubSeries of: GSE100005`), `series_type` which denotes the technology used to collect the sample. and status which is the same as the sample level.

Here’s what we want to allow users to filter by:
- platform
- series_type
- organism
- number of samples in a series
