
var settings = require('../../settings-test-end2end.json');

// Calls the server method to clean database and create fresh test users
var resetMyApp = function () {
    try {
        server.call('e2e.resetMyApp');
    } catch (e) {
        console.log("Exception: "+e);
        console.log("Did you forget to run the server with '--settings settings-test-end2end.json'?");
    }
};


var isLoggedIn = function () {
    try {
        browser.waitForExist('#navbar-signout', 1000);
    } catch (e) {
        // give browser some time, on fresh login
    }
    return browser.isExisting('#navbar-signout');
};


var logoutUser = function () {
    if (isLoggedIn()) {
        browser.click('#navbar-signout')
    }
};


/**
 * Logout current user, if necessary, then login a specific test user 
 * @param index of test user from setting. optional.
 */
var loginUser = function (index) {
    if (!index) {
        index = 0;
    }
    var aUser = settings.e2eTestUsers[index];
    var aPassword = settings.e2eTestPasswords[index];

    logoutUser();
    try {    // try to log in
        if (browser.isExisting('#at-field-username_and_email')) {
            browser.setValue('input[id="at-field-username_and_email"]', aUser);
            browser.setValue('input[id="at-field-password"]', aPassword);
            browser.keys(['Enter']);

            if (browser.isExisting('.at-error.alert.alert-danger')) {
                throw new Error ("Unknown user or wrong password.")
            }
        }
    } catch (e) {
        throw new Error ("Login failed for user "+aUser + " with "+aPassword+"\nwith "+e);
    }
};


var launchApp = function () {
    browser.url(settings.e2eUrl);       // browser = WebdriverIO instance

    if (browser.getTitle() != "4minitz!") {
        throw new Error("App not loaded. Unexpected title "+browser.getTitle()+". Please run app with 'meteor npm run test:end2end:server'")
    }
};


// We can't use "launchApp" here, as this resets the browser
var gotoStartPage = function () {
    browser.click('a.navbar-brand');
};

// ************* EXPORTS ****************
module.exports.settings = settings;
module.exports.resetMyApp = resetMyApp;
module.exports.isLoggedIn = isLoggedIn;
module.exports.loginUser = loginUser;
module.exports.logoutUser = logoutUser;
module.exports.launchApp = launchApp;
module.exports.gotoStartPage = gotoStartPage;
