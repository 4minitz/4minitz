
TEST="$1"

PATH=$PATH:$HOME/.meteor/

if [ "$TRAVIS" = "true"]; then
    BUILD=$TRAVIS_BUILD_NUMBER
    JOB=$TRAVIS_JOB_NUMBER
    echo Find screenshots here: http://s3files.4minitz.com/4minitz/4minitz/$BUILD/$BUILD.$JOB/tests/snapshots
fi

if [ "$TEST" = "unit" ]; then
    echo Run unit test
    npm run test:unit
    UNIT=$?
    exit $(($UNIT))
fi

echo Run end2end tests: "$TEST"

echo Remove old log file
rm server.log

echo Start end2end server
npm run test:end2end:server > server.log&

COUNTER=0
MAX_WAIT=900
until grep "=> App running at" server.log; do
    echo App has not started yet.. Waiting for $COUNTER seconds
    sleep 30
    COUNTER=$(($COUNTER+30))

    if [ $COUNTER -gt $MAX_WAIT ]; then
        echo Meteor takes too long to start, exiting. Server log:
        cat server.log
        exit 1
    fi
done

sleep 10

echo Start end2end test runner
chimp .meteor/chimp_config_headless.js --ddp=http://localhost:3100 --mocha --path=tests/end2end --browser=chrome -- $TEST tests/end2end/setup.js

CHIMP_RESULT=$?

echo Server log:
cat server.log
rm server.log

mkdir tests/mongodump
mongodump -h localhost:3101 -d meteor -o ./tests/mongodump

exit $CHIMP_RESULT
