FROM postgres:17

# install tools needed to load data (sqlite, duckdb)
RUN apt-get update && \
    apt-get install -y --no-install-recommends sqlite3 curl && \
    rm -rf /var/lib/apt/lists/*

# install duckdb, add to the path
RUN curl https://install.duckdb.org | sh
ENV PATH="/root/.duckdb/cli/latest:${PATH}"

# copy "loader" config enabled via environment variable PGCONFIG_LOADING=1
COPY ./configs/postgresql_load.conf /opt/alt-configs/postgresql_load.conf
RUN chmod o+r /opt/alt-configs/postgresql_load.conf

# copy initialization, post-init scripts
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
COPY docker-entrypoint-postinit.d/ /docker-entrypoint-postinit.d/

# copy patched entrypoint scripts, healthcheck script
COPY patched-docker-entrypoint-17.sh /usr/local/bin/docker-entrypoint.sh
COPY ./healthcheck.sh /opt/healthcheck.sh
