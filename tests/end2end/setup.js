
import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { setupWrappers } from './helpers/BrowserWrappers';


before(function() {
    console.log('End2End Settings:');
    console.log('# of test users:', E2EGlobal.SETTINGS.e2eTestUsers.length);

    setupWrappers();

    // Some E2E tests run more robust on "large" width screen
    if (E2EGlobal.browserIsPhantomJS()) {
        browser.setViewportSize({
            width: 1024,
            height: browser.getViewportSize('height')
        });
    }

    E2EApp.resetMyApp();
    E2EApp.launchApp();
    E2EApp.loginUser();
    expect(E2EApp.isLoggedIn(), 'User is logged in').to.be.true;
});

beforeEach(function() {
    if (!this.currentTest) {
        return;
    }

    const testName = this.currentTest.title;
    browser.execute((testName) => {
        console.log('--- TEST CASE STARTED --- >' + testName + '<');
    }, testName);

    server.call('e2e.debugLog', `--- TEST CASE STARTED --- >${testName}<`);
});

afterEach(function() {
    if (!this.currentTest) {
        return;
    }

    const testName = this.currentTest.title,
        testState = this.currentTest.state;

    browser.execute((testName, state) => {
        console.log('--- TEST CASE FINISHED --- >' + testName + '<');
        console.log('--- TEST CASE STATUS: ' + state);
    }, testName, testState);

    server.call('e2e.debugLog', `--- TEST CASE FINISHED --- >${testName}<`);
    server.call('e2e.debugLog', `--- TEST CASE STATUS: ${testState}`);

    if (this.currentTest.state !== 'passed') {
        E2EGlobal.logTimestamp('TEST FAILED');
        console.log('!!! FAILED: ', this.currentTest.title, this.currentTest.state);
        console.log('!!! Saving POST-MORTEM SCREENSHOT:');
        console.log('!!! ', E2EGlobal.saveScreenshot('FAILED_POST-MORTEM'));
    }
});
