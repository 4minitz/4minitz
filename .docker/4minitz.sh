#!/bin/bash

basedir4min=/4minitz_storage
settingsfile=${basedir4min}/4minitz_settings.json
mongodatadir=${basedir4min}/4minitz_mongodb
logdir=${basedir4min}/log
containerid=$(basename "$(head /proc/1/cgroup)" | cut -c 1-12)
lockfile=${basedir4min}/4minitz.lock

function signalhandler {
    echo ""
    echo ""
    echo "STOP received."
    echo "Shutting down mongodb..."
    mongod --shutdown --dbpath=${mongodatadir}
    rm ${lockfile}
    echo "------------------------------- STOP 4Minitz!" >> ${logdir}/4minitz.log
    exit 0
}
trap signalhandler SIGHUP SIGINT SIGTERM

# Check for other container on same storage directory
if [ -f "$lockfile" ]
then
    echo "*** ERROR ***"
    echo "Found lockfile $lockfile."
    echo "Another container with 4Minitz seems to be using"
    echo "the same host storage directory. Please first execute:"
    othercontainerid=$(cat ${lockfile})
    echo "docker stop $othercontainerid"
    exit 1
else
    echo $containerid > $lockfile
fi


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

mkdir ${mongodatadir} 2> /dev/null
mkdir ${logdir} 2> /dev/null
mongod --fork --dbpath=${mongodatadir} --logpath ${logdir}/mongodb.log

#wait for mongodb to be ready
echo "Waiting for mongodb to be ready..."
while ! /usr/bin/mongo --eval "db.version()" > /dev/null 2>&1; do sleep 0.1; done
echo "Mongodb is ready."

cd /4minitz_bin/bundle

# export MONGO_URL="mongodb://$MONGO_HOST:27017/"
export MONGO_URL="mongodb://localhost:27017/"
export PORT=3333
export ROOT_URL='http://localhost:3100'
export METEOR_SETTINGS=$(cat ${basedir4min}/4minitz_settings.json)

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
echo "******"
echo "Logging to ${logdir}/4minitz.log"
echo ""
echo "******"
echo "You can stop this service by:"
echo "Ctrl+c or 'docker stop $containerid'"
echo ""

echo "------------------------------- New 4Minitz!" >> ${logdir}/4minitz.log
# Important: The bg "&" execution of 'node' together with 'wait' ensures that
# the 'docker stop' SIGINT is properly routed to the signal trap of
# this wrapper script. So we can shutdown mongodb in the signalhandler()
node main.js >> ${logdir}/4minitz.log 2>&1 &
wait

rm ${lockfile}
exit 1
