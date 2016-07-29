
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

WAITTIME=480
if [ -d "$DIRECTORY" ]; then
    echo Meteor local exists, use shorter timeout?
fi

echo Start end2end server
npm run test:end2end:server&

echo Wait for server
sleep $WAITTIME

echo Start end2end test runner
chimp --ddp=http://localhost:3100 --mocha --path=tests/end2end --browser=phantomjs -- $TEST tests/end2end/setup.js

