#!/bin/bash

basedir4min=/4minitz_storage
settingsfile=$basedir4min/4minitz_settings.json

if [ -f "$settingsfile" ]
then
    echo "4minitz_settings.json found on your local host directory."
else
    echo "Copying 4minitz_settings.json to your local host directory - once!"
    cp /4minitz_settings.json $settingsfile
    echo "DONE."
fi
echo "You may edit the settings file locally on your host."
echo "Then restart this docker container."

if [ -d "$basedir4min" ] && [ -x "$basedir4min" ]; then
    echo "Inside container basedir: $basedir4min - OK"
else
    echo ""
    echo "!!! ERROR !!!"
    echo "Basedir $basedir4min not accessible inside container."
    echo "You must launch 'docker run' with a volume. E.g.:"
    echo "-v \$(pwd)/4minitz_storage:/4minitz_storage"
    echo "Terminating container now."
    echo ""
    exit 1
fi

mkdir $basedir4min/4minitz_mongodb
mkdir $basedir4min/log
mongod --dbpath=$basedir4min/4minitz_mongodb --logpath $basedir4min/log/mongodb.log &

#wait for mongodb to be ready
while ! /usr/bin/mongo --eval "db.version()" > /dev/null 2>&1; do sleep 0.1; done

cd /4minitz_bin/bundle

# export MONGO_URL="mongodb://$MONGO_HOST:27017/"
export MONGO_URL="mongodb://localhost:27017/"
export PORT=3333
export ROOT_URL='http://localhost:3100'
export METEOR_SETTINGS=$(cat $basedir4min/4minitz_settings.json)

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
echo ""

node main.js | tee $basedir4min/log/4minitz.log
