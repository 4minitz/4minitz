
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

echo Start end2end server
npm run test:end2end:server&

echo Wait for server
# give the server time to start
sleep 180
echo 180
sleep 180
echo 360
sleep 120
echo 480

echo Start end2end test runner
chimp --ddp=http://localhost:3100 --mocha --path=tests/end2end --browser=phantomjs -- $TEST tests/end2end/setup.js

