#!/bin/bash

basedir4min=/4minitz_storage
settingsfile=${basedir4min}/4minitz_settings.json

# Settings file, initial copy from container to host once
if [ -f "$settingsfile" ]
then
    echo "4minitz_settings.json found on your local host directory."
else
    echo "Copying 4minitz_settings.json to your local host directory - once!"
    cp /4minitz_settings.json ${settingsfile}
    echo "DONE."
fi
echo "You may edit the settings file locally on your host."
echo "Then restart this docker container."

cd /4minitz_bin/bundle

export PORT=3333
export ROOT_URL='http://localhost:3100'
export METEOR_SETTINGS=$(cat ${basedir4min}/4minitz_settings.json)
export UNIVERSE_I18N_LOCALES='all'

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
