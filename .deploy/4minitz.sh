#!/bin/bash

basedir4min=/4minitz_storage
settingsfile=$basedir4min/4minitz_settings.json

if [[ ! -d $basedir4min ]]; then
  echo "Could not find $basedir4min. This script is intended as an entrypoint"
  echo "for the 4Minitz Docker container. To start the app without Docker"
  echo "adjust the $(./deploy/run_sample.sh) script and use that."
  exit 1
fi

# Settings file, initial copy from container to host once
if [ -f "$settingsfile" ]; then
  echo "4minitz_settings.json found on your local host directory."
else
  echo "Copying 4minitz_settings.json to your local host directory - once!"
  cp /4minitz_settings.json "$settingsfile"
  echo "DONE."
fi
echo "You may edit the settings file locally on your host."
echo "Then restart this docker container."

cd /4minitz_bin/bundle || exit

export PORT=3333
export ROOT_URL='http://localhost:3100'
export METEOR_SETTINGS="$(cat "$basedir4min"/4minitz_settings.json)"
export UNIVERSE_I18N_LOCALES='all'

echo ""
echo "Checking for MongoDB"

# From https://gist.github.com/megahertz/c46136a77c4d42e285ec5a2f32215903
#
# Usage: parse_mongo_url URL
# It sets the following variables:
# MONGO_HOST
# MONGO_PORT
# MONGO_DATABASE
# MONGO_USER
# MONGO_PASSWORD
function parse_mongo_url {
  local MONGO_URL="$1"

  local AUTH
  local HOST_PORT
  local PROTO
  local URL

  PROTO="$(echo "$MONGO_URL" | grep :// | sed -e's,^\(.*://\).*,\1,g')"
  URL="${MONGO_URL/${PROTO}/}"

  AUTH="$(echo "$URL" | grep @ | rev | cut -d@ -f2- | rev)"
  if [[ -n ${AUTH} ]]; then
    URL="$(echo "$URL" | rev | cut -d@ -f1 | rev)"
  fi

  MONGO_PASSWORD="$(echo "$AUTH" | grep : | cut -d: -f2-)"
  if [ -n "$MONGO_PASSWORD" ]; then
    MONGO_USER="$(echo "$AUTH" | grep : | cut -d: -f1)"
  else
    MONGO_USER=$AUTH
  fi

  HOST_PORT="$(echo "$URL" | cut -d/ -f1)"
  MONGO_PORT="$(echo "$HOST_PORT" | grep : | cut -d: -f2)"
  if [ -n "$MONGO_PORT" ]; then
    MONGO_HOST="$(echo "$HOST_PORT" | grep : | cut -d: -f1)"
  else
    MONGO_PORT=27017
    MONGO_HOST="$HOST_PORT"
  fi

  MONGO_DATABASE="$(echo "$URL" | grep / | cut -d/ -f2-)"
}

parse_mongo_url "$MONGO_URL"

# Wait until mongo logs that it's ready (or timeout after 60s)
COUNTER=0
while ! (nc -z "$MONGO_HOST" "$MONGO_PORT") && [[ $COUNTER -lt 60 ]]; do
  sleep 2
  let COUNTER+=2
  echo "Waiting for mongo to initialize... ($COUNTER seconds so far)"
done

if [[ $COUNTER -ge 60 ]]; then
  echo "MongoDB not found! Aborting 4Minitz start."
  echo "Did you set up a MongoDB and pass in the correct MONGO_URL?"
  echo "Since version 2.0 4Minitz longer comes bundled with a MongoDB."
  echo "You need to set up your own database instance. See our admin guide:"
  echo ""
  echo "https://github.com/4minitz/4minitz/blob/develop/doc/admin/adminguide.md"
  echo ""
  exit 1
fi

echo "MongoDB is up and running, starting 4Minitz..."

echo ""
echo "***********************************"
echo "*-- Welcome to 4Minitz in Docker--*"
echo "*                                 *"
echo "* IF                              *"
echo "*   you launched the container    *"
echo "*   with the -p 3100:3333 option  *"
echo "* THEN                            *"
echo "*   You can open 4Minitz on your  *"
echo "*   host browser via:             *"
echo "*   http://localhost:3100         *"
echo "***********************************"
echo ""

node main.js
