#!/usr/bin/env bash

TEST="$1"       # We will run these tests

echo Remove old log file
SERVERLOG=./tests/e2e2/logs/server.log
rm ${SERVERLOG}

echo Start end2end server
npm run test:end2end:server > ${SERVERLOG} &

COUNTER=0
MAX_WAIT=900
until grep "=> App running at" ${SERVERLOG}; do
    echo App has not started yet.. Waiting for $COUNTER seconds
    sleep 30
    COUNTER=$(($COUNTER+30))

    if [ $COUNTER -gt $MAX_WAIT ]; then
        echo Meteor takes too long to start, exiting. Server log:
        cat ${SERVERLOG}
        exit 1
    fi
done
sleep 10

echo Start end2end test runner
export NODE_ENV=end2end   # evaluated by .babel.rc - will break server build/launch above!
npx wdio run wdio.conf.js --spec ${TEST}
# chimp .meteor/chimp_config_headless.js --ddp=http://localhost:3100 --mocha --path=tests/end2end --browser=chrome -- $TEST tests/end2end/setup.js

WDIO_RESULT=$?

#echo Server log: http://4m.js42.de/4minitz/4minitz/$BUILD/$JOB/server.log
#echo Client log: http://4m.js42.de/4minitz/4minitz/$BUILD/$JOB/client.log

#mkdir tests/mongodump
#mongodump -h localhost:3101 -d meteor -o ./tests/mongodump

# archive versions
#mkdir versions
#npm ls > ./versions/npm.txt
#google-chrome --version > ./versions/chrome.txt
#chimp --version > ./versions/chimp.txt

exit ${WDIO_RESULT}
