
import { E2EGlobal } from './E2EGlobal'


export class E2EApp {
    // Calls the server method to clean database and create fresh test users
    static resetMyApp (skipUsers) {
        try {
            server.call('e2e.resetMyApp', skipUsers);  // call meteor server method
        } catch (e) {
            console.log("Exception: "+e);
            console.log("Did you forget to run the server with '--settings settings-test-end2end.json'?");
        }
    };

    static isLoggedIn () {
        try {
            browser.waitForExist('#navbar-signout', 2000);         // browser = WebdriverIO instance
        } catch (e) {
            // give browser some time, on fresh login
        }
        return browser.isExisting('#navbar-signout');
    };

    static logoutUser () {
        if (E2EApp.isLoggedIn()) {
            browser.click('#navbar-signout');
            E2EGlobal.waitSomeTime();
        }
        E2EApp._currentlyLoggedInUser = "";
    };

    /**
     * Logout current user, if necessary, then login a specific test user
     * @param index of test user from setting. optional.
     */
    static loginUser (index) {
        if (!index) {
            index = 0;
        }
        let aUser = E2EGlobal.SETTINGS.e2eTestUsers[index];
        let aPassword = E2EGlobal.SETTINGS.e2eTestPasswords[index];

        E2EApp.logoutUser();
        try {    // try to log in
            if (browser.isExisting('#at-field-username_and_email')) {
                browser.setValue('input[id="at-field-username_and_email"]', aUser);
                browser.setValue('input[id="at-field-password"]', aPassword);
                browser.keys(['Enter']);
                E2EGlobal.waitSomeTime();

                if (browser.isExisting('.at-error.alert.alert-danger')) {
                    throw new Error ("Unknown user or wrong password.")
                }
                E2EApp.isLoggedIn();
                E2EApp._currentlyLoggedInUser = aUser;
            }
        } catch (e) {
            throw new Error ("Login failed for user "+aUser + " with "+aPassword+"\nwith "+e);
        }
    };

    static getCurrentUser () {
        return E2EApp._currentlyLoggedInUser;
    };
    
    static launchApp () {
        browser.url(E2EGlobal.SETTINGS.e2eUrl);

        if (browser.getTitle() != "4minitz!") {
            throw new Error("App not loaded. Unexpected title "+browser.getTitle()+". Please run app with 'meteor npm run test:end2end:server'")
        }
    };


    static isOnStartPage () {
        // post-condition
        try {
            browser.waitForExist('#btnNewMeetingSeries', 2000);
        } catch (e) {
            return false;
        }
        return true;
    };

    // We can't use "launchApp" here, as this resets the browser
    // so we click on the "Logo" icon
    static gotoStartPage () {
        browser.click('a.navbar-brand');
        E2EGlobal.waitSomeTime();
        // check post-condition
        expect (E2EApp.isOnStartPage(), "gotoStartPage()").to.be.true;
    };

    static confirmationDialogAnswer (pressOK) {
        E2EGlobal.waitSomeTime(750); // give dialog animation time
        browser.waitForVisible('#confirmationDialogOK', 1000);
        if (pressOK) {
            browser.click("#confirmationDialogOK");
        } else {
            browser.click("#confirmationDialogCancel");
        }
        E2EGlobal.waitSomeTime(750); // give dialog animation time
    };
}

E2EApp._currentlyLoggedInUser = "";

