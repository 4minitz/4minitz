FROM node:8.9.4


#### Build-time metadata as defined at http://label-schema.org
# For layer details see: https://microbadger.com/images/4minitz/4minitz
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.label-schema.name="4Minitz" \
      org.label-schema.description="Simply a decent free webapp for taking meeting minutes" \
      org.label-schema.url="https://www.4minitz.com/" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/4minitz/4minitz" \
      org.label-schema.vendor="4Minitz-Team" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"


#### MongoDB connection configuration
#### This will fail since we no longer bundle a MongoDB
#### with our releases. It is expected that this is passed
#### in by the admin when instantiating the container.
ENV MONGO_URL mongodb://admin:admin@localhost/4minitz

#### Install Node.js
ENV NPM_CONFIG_LOGLEVEL info

#### In case you get this with a new node version:
####      Can't check signature: public key not found??
#### then see
####      https://github.com/nodejs/node#release-team
RUN set -ex \
    && apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        ghostscript \
        netcat \
        wkhtmltopdf \
        xauth \
        xvfb \
        xz-utils \
    && rm -rf /var/lib/apt/lists/* \
    \
    && find /usr/share/ghostscript -name 'PDFA_def.ps' -exec cp {} / \; \
    && find /usr/share/ghostscript -name 'srgb.icc' -exec cp {} / \; \
    && sed -i 's/\/ICCProfile.*/\/ICCProfile \(\/srgb.icc\)/' /PDFA_def.ps \
    && sed -i 's/\[\ \/Title.*/\[\ \/Title\ \(4Minitz Meeting Minutes\)/' /PDFA_def.ps


#### Copy 4Minitz stuff
COPY 4minitz_bin /4minitz_bin
COPY 4minitz.sh /
COPY 4minitz_bin/4minitz_settings_docker.json /4minitz_settings.json

VOLUME /4minitz_storage

# Important: do NOT use: 'CMD ./4minitz.sh' - this will result in
# a /bin/sh child process /bin/bash with a PID!=1 - so, the SIGINT
# signal will not go through to our launcher script
CMD ["/4minitz.sh"]
