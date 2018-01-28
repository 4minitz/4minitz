
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'


before(function() {
    console.log("End2End Settings:");
    console.log("# of test users:", E2EGlobal.SETTINGS.e2eTestUsers.length);

    // We refactor the browser.click() method to save a screenshot
    // with a unique ID if click() fails.
    browser.click_org = browser.click;
    browser.click = function (...args) {
        try {
            browser.click_org(...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.click() target "${args[0]}" not found - see screenshot with ID: ${id}`);
            E2EGlobal.saveScreenshot(`click-error_${id}`);
            throw e;
        }
    };

    // We refactor the browser.waitForVisible() method to save a screenshot
    // with a unique ID if waitForVisible() fails.
    browser.waitForVisible_org = browser.waitForVisible;
    browser.waitForVisible = function (selector, timeout = 10000, ...args) {
        try {
            browser.waitForVisible_org(selector, timeout, ...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.waitForVisible() target "${selector}" not found - see screenshot with ID: ${id}`);
            E2EGlobal.saveScreenshot(`waitForVisible-error_${id}`);
            throw e;
        }
    };

    // We refactor the browser.click() method to save a screenshot
    // with a unique ID if click() fails.
    browser.elementIdClick_org = browser.elementIdClick;
    browser.elementIdClick = function (...args) {
        try {
            browser.elementIdClick_org(...args);
        } catch (e) {
            let id = Math.random().toString(36).substr(2, 5);
            console.log(`browser.elementIdClick() target "${args[0]}" not found - see screenshot with ID: ${id}`);
            E2EGlobal.saveScreenshot(`clickId-error_${id}`);
            throw e;
        }
    };

    // Some E2E tests run more robust on "large" width screen
    if (E2EGlobal.browserIsPhantomJS()) {
        browser.setViewportSize({
            width: 1024,
            height: browser.getViewportSize("height")
        });
    }

    E2EApp.resetMyApp();
    E2EApp.launchApp();
    E2EGlobal.saveScreenshot("UserShouldBeLoggedIn0");
    E2EApp.loginUser();
    E2EGlobal.saveScreenshot("UserShouldBeLoggedIn1");
    expect(E2EApp.isLoggedIn(), "User is logged in").to.be.true;
});

afterEach(function() {
    if (this.currentTest && this.currentTest.state !== 'passed') {
        E2EGlobal.logTimestamp("TEST FAILED");
        console.log('!!! FAILED: ', this.currentTest.title, this.currentTest.state);
        console.log('!!! Saving POST-MORTEM SCREENSHOT:');
        console.log("!!! ", E2EGlobal.saveScreenshot(`FAILED_POST-MORTEM`));
    }
});
