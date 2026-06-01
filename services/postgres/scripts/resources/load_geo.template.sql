-- intended to be used in duckdb via the load_geometadb_omicidx_duckdb.sh script
-- run from within the postgres container

PRAGMA memory_limit='10GB';
PRAGMA threads=1;
PRAGMA temp_directory='/tmp/duckdb_tmp';

.mode line
.headers off
.timer on

INSTALL postgres;
LOAD postgres;

-- connect to postgres using env vars (these must be available in the env and substituted in via envsubst)
ATTACH 'host=${POSTGRES_HOST} port=${POSTGRES_PORT} dbname=${POSTGRES_DB} user=${POSTGRES_USER} password=${POSTGRES_PASSWORD}'
AS pg (TYPE postgres);

-- set things up for bulk load
CALL postgres_execute('pg', 'SET synchronous_commit = off');
CALL postgres_execute('pg', 'SET maintenance_work_mem = ''1GB''');
CALL postgres_execute('pg', 'SET work_mem = ''128MB''');
CALL postgres_execute('pg', 'SET temp_buffers = ''256MB''');

-- =========================================================================================
-- === GEO views on parquet
-- =========================================================================================

SELECT '>>> Creating views...' AS progress;

-- first, create views over the omicidx sources
CREATE OR REPLACE VIEW src_geo_series AS
SELECT *
FROM read_parquet('https://data-omicidx.cancerdatasci.org/geo/parquet/geo_series.parquet');

CREATE OR REPLACE VIEW src_geo_samples AS
SELECT *
FROM read_parquet('https://data-omicidx.cancerdatasci.org/geo/parquet/geo_samples.parquet');

-- CREATE OR REPLACE VIEW src_geo_series_with_rnaseq_counts AS
-- SELECT accession
-- FROM read_parquet('https://data-omicidx.cancerdatasci.org/geo/parquet/geo_series_with_rnaseq_counts.parquet');

CREATE OR REPLACE VIEW src_geo_platforms AS
SELECT *
FROM read_parquet('https://data-omicidx.cancerdatasci.org/geo/parquet/geo_platforms.parquet');

-- CREATE OR REPLACE VIEW src_sra_accessions AS
-- SELECT *
-- FROM read_parquet('https://data-omicidx.cancerdatasci.org/sra/parquet/sra_accessions.parquet');


-- =========================================================================================
-- === platform
-- =========================================================================================

SELECT '>>> Loading api_geoplatform' AS progress;

INSERT INTO pg.public.api_geoplatform (
    gpl,
    title,
    status,
    submission_date,
    last_update_date,
    technology,
    distribution,
    organism,
    manufacturer,
    manufacture_protocol,
    description,
    web_link,
    contact,
    data_row_count
)
SELECT
    accession AS gpl,
    title,
    status,
    CAST(submission_date AS VARCHAR) AS submission_date,
    CAST(last_update_date AS VARCHAR) AS last_update_date,
    technology,
    distribution,
    organism,
    array_to_string(manufacturer, '; ') AS manufacturer,
    manufacture_protocol,
    description,
    'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' || accession AS web_link,
    concat_ws(' ', contact."name"."first", contact."name"."last") AS contact,
    CAST(data_row_count AS INTEGER) AS data_row_count
FROM src_geo_platforms
ON CONFLICT (gpl) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    submission_date = EXCLUDED.submission_date,
    last_update_date = EXCLUDED.last_update_date,
    technology = EXCLUDED.technology,
    distribution = EXCLUDED.distribution,
    organism = EXCLUDED.organism,
    manufacturer = EXCLUDED.manufacturer,
    manufacture_protocol = EXCLUDED.manufacture_protocol,
    description = EXCLUDED.description,
    web_link = EXCLUDED.web_link,
    contact = EXCLUDED.contact,
    data_row_count = EXCLUDED.data_row_count;

-- =========================================================================================
-- === series
-- =========================================================================================

SELECT '>>> Loading api_geoseries' AS progress;

INSERT INTO pg.public.api_geoseries (
    gse,
    title,
    status,
    submission_date,
    last_update_date,
    pubmed_id,
    summary,
    type,
    contributor,
    web_link,
    overall_design,
    contact,
    supplementary_file
)
SELECT
    accession AS gse,
    title,
    status,
    CAST(submission_date AS VARCHAR) AS submission_date,
    CAST(last_update_date AS VARCHAR) AS last_update_date,
    pubmed_id[1] AS pubmed_id,
    summary,
    array_to_string(type, '; ') AS type,
    (
        SELECT string_agg(concat_ws(' ', c."first", c.middle, c."last"), '; ')
        FROM UNNEST(contributor) AS t(c)
    ) AS contributor,
    'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' || accession AS web_link,
    overall_design,
    concat_ws(' ', contact."name"."first", contact."name"."last") AS contact,
    (
        SELECT string_agg(
            regexp_replace(supplemental_file, '^ftp://', 'https://'),
            '; '
        )
        FROM UNNEST(supplemental_files) AS t(supplemental_file)
        WHERE supplemental_file <> 'NONE'
    ) AS supplementary_file
FROM src_geo_series
ON CONFLICT (gse) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    submission_date = EXCLUDED.submission_date,
    last_update_date = EXCLUDED.last_update_date,
    pubmed_id = EXCLUDED.pubmed_id,
    summary = EXCLUDED.summary,
    type = EXCLUDED.type,
    contributor = EXCLUDED.contributor,
    web_link = EXCLUDED.web_link,
    overall_design = EXCLUDED.overall_design,
    contact = EXCLUDED.contact,
    supplementary_file = EXCLUDED.supplementary_file;

-- =========================================================================================
-- === samples
-- =========================================================================================

SELECT '>>> Creating temp helper view sample_series_map' AS progress;

CREATE OR REPLACE TEMP VIEW sample_series_map AS
SELECT
    gsm,
    string_agg(gse, '; ' ORDER BY gse) AS series_id
FROM (
    SELECT
        accession AS gse,
        UNNEST(sample_id) AS gsm
    FROM src_geo_series
) x
GROUP BY gsm;

SELECT '>>> Loading api_geosample' AS progress;

INSERT INTO pg.public.api_geosample (
    gsm,
    title,
    series_id,
    gpl,
    status,
    submission_date,
    last_update_date,
    type,
    source_name_ch1,
    organism_ch1,
    characteristics_ch1,
    molecule_ch1,
    label_ch1,
    treatment_protocol_ch1,
    extract_protocol_ch1,
    label_protocol_ch1,
    source_name_ch2,
    organism_ch2,
    characteristics_ch2,
    molecule_ch2,
    label_ch2,
    treatment_protocol_ch2,
    extract_protocol_ch2,
    label_protocol_ch2,
    hyb_protocol,
    description,
    data_processing,
    contact,
    supplementary_file,
    data_row_count,
    channel_count
)
SELECT
    s.accession AS gsm,
    s.title,
    m.series_id,
    s.platform_id AS gpl,
    s.status,
    CAST(s.submission_date AS VARCHAR) AS submission_date,
    CAST(s.last_update_date AS VARCHAR) AS last_update_date,
    s.type,

    s.channels[1].source_name AS source_name_ch1,
    s.channels[1].organism AS organism_ch1,
    (
        SELECT string_agg(ch.tag || ': ' || ch."value", '; ')
        FROM UNNEST(s.channels[1]."characteristics") AS t(ch)
    ) AS characteristics_ch1,
    s.channels[1].molecule AS molecule_ch1,
    s.channels[1]."label" AS label_ch1,
    s.channels[1].treatment_protocol AS treatment_protocol_ch1,
    s.channels[1].extract_protocol AS extract_protocol_ch1,
    s.channels[1].label_protocol AS label_protocol_ch1,

    s.channels[2].source_name AS source_name_ch2,
    s.channels[2].organism AS organism_ch2,
    (
        SELECT string_agg(ch.tag || ': ' || ch."value", '; ')
        FROM UNNEST(s.channels[2]."characteristics") AS t(ch)
    ) AS characteristics_ch2,
    s.channels[2].molecule AS molecule_ch2,
    s.channels[2]."label" AS label_ch2,
    s.channels[2].treatment_protocol AS treatment_protocol_ch2,
    s.channels[2].extract_protocol AS extract_protocol_ch2,
    s.channels[2].label_protocol AS label_protocol_ch2,

    s.hyb_protocol,
    s.description,
    s.data_processing,
    concat_ws(' ', s.contact."name"."first", s.contact."name"."last") AS contact,
    (
        SELECT string_agg(
            regexp_replace(supplemental_file, '^ftp://', 'https://'),
            '; '
        )
        FROM UNNEST(s.supplemental_files) AS t(supplemental_file)
        WHERE supplemental_file <> 'NONE'
    ) AS supplementary_file,
    CAST(s.data_row_count AS INTEGER) AS data_row_count,
    CAST(s.channel_count AS INTEGER) AS channel_count
FROM src_geo_samples s
LEFT JOIN sample_series_map m
    ON s.accession = m.gsm
ON CONFLICT (gsm) DO UPDATE SET
    title = EXCLUDED.title,
    series_id = EXCLUDED.series_id,
    gpl = EXCLUDED.gpl,
    status = EXCLUDED.status,
    submission_date = EXCLUDED.submission_date,
    last_update_date = EXCLUDED.last_update_date,
    type = EXCLUDED.type,
    source_name_ch1 = EXCLUDED.source_name_ch1,
    organism_ch1 = EXCLUDED.organism_ch1,
    characteristics_ch1 = EXCLUDED.characteristics_ch1,
    molecule_ch1 = EXCLUDED.molecule_ch1,
    label_ch1 = EXCLUDED.label_ch1,
    treatment_protocol_ch1 = EXCLUDED.treatment_protocol_ch1,
    extract_protocol_ch1 = EXCLUDED.extract_protocol_ch1,
    label_protocol_ch1 = EXCLUDED.label_protocol_ch1,
    source_name_ch2 = EXCLUDED.source_name_ch2,
    organism_ch2 = EXCLUDED.organism_ch2,
    characteristics_ch2 = EXCLUDED.characteristics_ch2,
    molecule_ch2 = EXCLUDED.molecule_ch2,
    label_ch2 = EXCLUDED.label_ch2,
    treatment_protocol_ch2 = EXCLUDED.treatment_protocol_ch2,
    extract_protocol_ch2 = EXCLUDED.extract_protocol_ch2,
    label_protocol_ch2 = EXCLUDED.label_protocol_ch2,
    hyb_protocol = EXCLUDED.hyb_protocol,
    description = EXCLUDED.description,
    data_processing = EXCLUDED.data_processing,
    contact = EXCLUDED.contact,
    supplementary_file = EXCLUDED.supplementary_file,
    data_row_count = EXCLUDED.data_row_count,
    channel_count = EXCLUDED.channel_count;
