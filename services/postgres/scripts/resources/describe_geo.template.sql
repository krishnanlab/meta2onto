-- intended to be used in duckdb via the load_geometadb_omicidx_duckdb.sh script
-- run from within the postgres container

.mode line
.headers on
.timer on


PRAGMA memory_limit='1GB';
PRAGMA threads=1;

INSTALL postgres;
LOAD postgres;

-- connect to postgres using env vars (these must be available in the env and substituted in via envsubst)
ATTACH 'host=${POSTGRES_HOST} port=${POSTGRES_PORT} dbname=${POSTGRES_DB} user=${POSTGRES_USER} password=${POSTGRES_PASSWORD}'
AS pg (TYPE postgres);

-- turn on echo after so we don't echo out sensitive info like the password in the attach statement
.echo on

DESCRIBE SELECT *
FROM read_parquet('https://data-omicidx.cancerdatasci.org/geo/parquet/geo_platforms.parquet');

DESCRIBE SELECT *
FROM read_parquet('https://data-omicidx.cancerdatasci.org/geo/parquet/geo_series.parquet');

DESCRIBE SELECT *
FROM read_parquet('https://data-omicidx.cancerdatasci.org/geo/parquet/geo_samples.parquet');
