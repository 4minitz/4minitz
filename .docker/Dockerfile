# FROM mongo:3.4
FROM mongo:3.4.10

MAINTAINER 4Minitz-Team <4minitz@gmx.de>

#### Build-time metadata as defined at http://label-schema.org
# For layer details see: https://microbadger.com/images/4minitz/4minitz
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="4Minitz" \
      org.label-schema.description="Simply a decent free webapp for taking meeting minutes" \
      org.label-schema.url="https://www.4minitz.com/" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/4minitz/4minitz" \
      org.label-schema.vendor="4Minitz-Team" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"


#### Install Node.js
ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 8.9.4

#### In case you get this with a new node version:
####      Can't check signature: public key not found??
#### then see
####      https://github.com/nodejs/node#release-team
RUN groupadd --gid 1000 node \
    && useradd --uid 1000 --gid node --shell /bin/bash --create-home node \
    && set -ex \
    && for key in \
        56730D5401028683275BD23C23EFEFE93C4CFFFE \
        71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
        77984A986EBC2AA786BC0F66B01FBB92821C587A \
        94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
        B9AE9905FFD7803F25714661B63B535A4C206CA9 \
        C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
        DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
        FD3A5288F042B6850C66B31F09FE44734EB7990E \
      ; do \
            gpg --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys "$key" || \
            gpg --keyserver hkp://ipv4.pool.sks-keyservers.net --recv-keys "$key" || \
            gpg --keyserver hkp://pgp.mit.edu:80 --recv-keys "$key" ; \
        done \
    \
    && apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        git \
        openssh-client \
        wget \
        xz-utils \
        nano \
        wkhtmltopdf xauth xvfb ghostscript=9.06~dfsg-2+deb8u6 \
    && rm -rf /var/lib/apt/lists/* \
    \
    && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" \
    && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
    && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
    && grep " node-v$NODE_VERSION-linux-x64.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v$NODE_VERSION-linux-x64.tar.xz" -C /usr/local --strip-components=1 \
    && rm "node-v$NODE_VERSION-linux-x64.tar.xz" SHASUMS256.txt.asc SHASUMS256.txt \
    && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
    \
    && cp /usr/share/ghostscript/9.06/lib/PDFA_def.ps / \
    && cp /usr/share/ghostscript/9.06/iccprofiles/srgb.icc / \
    && sed -i 's/\/ICCProfile.*/\/ICCProfile \(\/srgb.icc\)/' /PDFA_def.ps \
    && sed -i 's/\[\ \/Title.*/\[\ \/Title\ \(4Minitz Meeting Minutes\)/' /PDFA_def.ps


#### Copy 4Minitz stuff
COPY 4minitz_bin /4minitz_bin
COPY 4minitz.sh /
COPY 4minitz_settings.json /

# Important: do NOT use: 'CMD ./4minitz.sh' - this will result in
# a /bin/sh child process /bin/bash with a PID!=1 - so, the SIGINT
# signal will not go through to our launcher script
CMD ["/4minitz.sh"]
