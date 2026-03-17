FROM postgres:17

# copy "loader" config enabled via environment variable PGCONFIG_LOADING=1
COPY ./configs/postgresql_load.conf /opt/alt-configs/postgresql_load.conf

# copy initialization, post-init scripts
COPY docker-entrypoint-initdb.d/ /docker-entrypoint-initdb.d/
COPY docker-entrypoint-postinit.d/ /docker-entrypoint-postinit.d/

# copy patched entrypoint scripts, healthcheck script
COPY patched-docker-entrypoint-17.sh /usr/local/bin/docker-entrypoint.sh
COPY ./healthcheck.sh /opt/healthcheck.sh
