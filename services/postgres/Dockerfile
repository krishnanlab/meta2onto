FROM postgres:17

# install tools needed to load data (sqlite, duckdb)
RUN apt-get update && \
    apt-get install -y --no-install-recommends sqlite3 ca-certificates curl gettext-base && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# install duckdb, add to the path
RUN curl https://install.duckdb.org | sh
ENV PATH="/root/.duckdb/cli/latest:${PATH}"

# copy "loader" config(s) enabled via environment variable PGCONFIG_LOADING=1
# ('prod' config loaded via PGCONFIG_PROD_CONFIG)
COPY ./configs/ /opt/alt-configs/
RUN chmod o+r /opt/alt-configs/*

# copy initialization, post-init scripts
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
COPY docker-entrypoint-postinit.d/ /docker-entrypoint-postinit.d/

# copy patched entrypoint scripts, healthcheck script
COPY patched-docker-entrypoint-17.sh /usr/local/bin/docker-entrypoint.sh
COPY ./healthcheck.sh /opt/healthcheck.sh
