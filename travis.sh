
TEST="$1"

if [ "$TEST" = "unit" ]; then
    echo Run unit and integration tests
    npm run test:unit
    UNIT=$?
    npm run test:integration:headless
    INT=$?
    exit $(($UNIT + $INT))
fi

echo Run end2end tests: "$TEST"

echo Remove old log file
rm meteor.log

echo Start end2end server
npm run test:end2end:server > meteor.log&

COUNTER=0
MAX_WAIT=900
until grep "=> App running at" meteor.log; do
    echo App has not started yet.. Waiting for $COUNTER seconds
    sleep 30
    COUNTER=$(($COUNTER+30))

    if [ $COUNTER -gt $MAX_WAIT ]; then
        echo Meteor takes too long to start, exiting. Meteor log:
        cat meteor.log
        exit 1
    fi
done

echo Start end2end test runner
chimp --ddp=http://localhost:3100 --mocha --path=tests/end2end --browser=phantomjs -- $TEST tests/end2end/setup.js

CHIMP_RESULT=$?

echo Meteor server log:
cat meteor.log
rm meteor.log

exit $CHIMP_RESULT
