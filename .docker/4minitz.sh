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

# Check if storage basedir is existing and accessible
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

# Spin up MongoDB server inside container
mkdir ${mongodatadir} 2> /dev/null
mkdir ${logdir} 2> /dev/null
mongod --fork --dbpath=${mongodatadir} --logpath ${logdir}/mongodb.log

#wait for mongodb to be ready
echo "Waiting for mongodb to be ready..."
while ! /usr/bin/mongo --eval "db.version()" > /dev/null 2>&1; do sleep 0.1; done
echo "Mongodb is ready."

cd /4minitz_bin/bundle

# Respect MONGO_URL if set from 'docker -e' command line
if [ -z "${MONGO_URL}" ]
then
    # Let's check if there exists an admin DB with a meetingSeries collection
    # This ensures backward compatibility with 4Minitz v1.0.2 [stable]
    if echo -e "use admin\ndb.getCollectionNames()" | mongo | grep -q "\"meetingSeries\""
    then
        echo "** Setting MONGO_URL to 4Minitz v1.0 default"
        export MONGO_URL="mongodb://localhost:27017/admin"
    else
        echo "** Setting MONGO_URL to 4Minitz v1.5 default"
        export MONGO_URL="mongodb://localhost:27017/4minitz"
    fi
else
    echo "** Keeping MONGO_URL from 'docker -e'"
fi
echo "MONGO_URL=${MONGO_URL}"

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
echo "******"
echo "Logging to ${logdir}/4minitz.log"
echo ""
echo "******"
echo "To log in to your 4minitz server container:"
echo "    docker exec -it $containerid /bin/bash"
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
