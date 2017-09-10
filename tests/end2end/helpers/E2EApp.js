
import { E2EGlobal } from './E2EGlobal'


export class E2EApp {
    static titlePrefix = "4Minitz!";

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
            browser.waitForExist('#navbar-usermenu', 5000);         // browser = WebdriverIO instance
        } catch (e) {
            // give browser some time, on fresh login
            E2EGlobal.saveScreenshot('isLoggedIn_failed');
        }
        return browser.isExisting('#navbar-usermenu');
    };

    static logoutUser () {
        if (E2EApp.isLoggedIn()) {
            E2EGlobal.clickWithRetry('#navbar-usermenu');
            E2EGlobal.clickWithRetry('#navbar-signout');
            E2EGlobal.waitSomeTime();
        }
        E2EApp._currentlyLoggedInUser = "";
        expect(browser.getTitle()).to.equal(E2EApp.titlePrefix);
    };

    static loginLdapUserWithCredentials(username, password, autoLogout) {
        this.loginUserWithCredentials(username, password, autoLogout, '#tab_ldap');
    }

    static loginFailed() {
        const standardLoginErrorAlertExists = browser.isExisting('.at-error.alert.alert-danger'),
            generalAlertExists = browser.isExisting('.alert.alert-danger');
        let generalAlertShowsLoginFailure = false;

        try {
            generalAlertShowsLoginFailure = browser.getHTML('.alert.alert-danger').includes('403');
        } catch (e) {
            const expectedError = `An element could not be located on the page using the given search parameters (".alert.alert-danger")`;
            if (!e.toString().includes(expectedError)) {
                throw e;
            }
        }

        return standardLoginErrorAlertExists ||
            (generalAlertExists && generalAlertShowsLoginFailure);
    }

    static loginUserWithCredentials(username, password, autoLogout = true, tab = '#tab_standard') {
        if (autoLogout) {
            E2EApp.logoutUser();
        }

        try {
            browser.waitForVisible(tab, 5000);
            E2EGlobal.clickWithRetry(tab);

            browser.waitUntil(_ => {
                let tabIsStandard = browser.isExisting('#at-field-username_and_email');
                let userWantsStandard = tab === '#tab_standard';
                let tabIsLdap = browser.isExisting('#id_ldapUsername');
                let userWantsLdap = tab === '#tab_ldap';

                return (tabIsStandard && userWantsStandard) || (tabIsLdap && userWantsLdap);
            }, 5000);

            let tabIsStandard = browser.isExisting('#at-field-username_and_email');
            let tabIsLdap = browser.isExisting('#id_ldapUsername');

            if (tabIsStandard) {
                E2EGlobal.setValueSafe('input[id="at-field-username_and_email"]', username);
                E2EGlobal.setValueSafe('input[id="at-field-password"]', password);
            }

            if (tabIsLdap) {
                E2EGlobal.setValueSafe('input[id="id_ldapUsername"]', username);
                E2EGlobal.setValueSafe('input[id="id_ldapPassword"]', password);
            }

            browser.keys(['Enter']);

            browser.waitUntil(_ => {
                const userMenuExists = browser.isExisting('#navbar-usermenu');
                return userMenuExists || E2EApp.loginFailed();
            }, 20000);

            if (E2EApp.loginFailed()) {
                throw new Error ("Unknown user or wrong password.");
            }

            if (! E2EApp.isLoggedIn()) {
                console.log("loginUserWithCredentials: no success via UI... trying Meteor.loginWithPassword()");
                browser.execute( function() {
                    Meteor.loginWithPassword(username, password);
                });
                browser.waitUntil(_ => {
                    const userMenuExists = browser.isExisting('#navbar-usermenu');
                    return userMenuExists || E2EApp.loginFailed();
                }, 5000);
            }

            E2EApp._currentlyLoggedInUser = username;
        } catch (e) {
            E2EGlobal.saveScreenshot('loginUserWithCredentials_failed');
            throw new Error (`Login failed for user ${username} with ${password}\nwith ${e}`);
        }
    }

    /**
     * Logout current user, if necessary, then login a specific test user
     * @param indexOrUsername of test user from setting. optional.
     * @param autoLogout perform logout before login the test user. optional.
     */
    static loginUser (indexOrUsername, autoLogout) {
        if (!indexOrUsername) {
            indexOrUsername = 0;
        }
        if (typeof indexOrUsername === 'string') {
            let orgUserName = indexOrUsername;
            indexOrUsername = E2EGlobal.SETTINGS.e2eTestUsers.indexOf(indexOrUsername);
            if (indexOrUsername === -1) {
                console.log("Error {E2EApp.loginUser} : Could not find user "+orgUserName+". Fallback: index=0.");
                indexOrUsername = 0;
            }
        }

        let aUser = E2EGlobal.SETTINGS.e2eTestUsers[indexOrUsername];
        let aPassword = E2EGlobal.SETTINGS.e2eTestPasswords[indexOrUsername];

        this.loginUserWithCredentials(aUser, aPassword, autoLogout);
    };

    static getCurrentUser () {
        return E2EApp._currentlyLoggedInUser;
    };
    
    static launchApp () {
        browser.url(E2EGlobal.SETTINGS.e2eUrl);

        const title = browser.getTitle();
        if (title !== E2EApp.titlePrefix) {
            throw new Error(`App not loaded. Unexpected title ${title}. Please run app with 'meteor npm run test:end2end:server'`);
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
        browser.keys(['Escape']);   // close eventually open modal dialog
        E2EGlobal.waitSomeTime();
        try {
            browser.waitForExist('a.navbar-brand', 2500);
        } catch (e) {
            E2EApp.launchApp();
        }
        // Just in case we have not already a user logged in, we do it here!
        if (! E2EApp.isLoggedIn()) {
            E2EApp.loginUser(0, false);
        }
        E2EGlobal.clickWithRetry('a.navbar-brand', 6000);
        E2EGlobal.waitSomeTime();
        // check post-condition
        if (! E2EApp.isOnStartPage()) {
            E2EGlobal.saveScreenshot("gotoStartPage1");
            E2EGlobal.clickWithRetry('a.navbar-brand');
            E2EGlobal.waitSomeTime(1500);
        }
        if (! E2EApp.isOnStartPage()) {
            E2EGlobal.saveScreenshot("gotoStartPage2");
        }
        expect(browser.getTitle()).to.equal(E2EApp.titlePrefix);
        expect(E2EApp.isOnStartPage(), "gotoStartPage()").to.be.true;
    };

    static confirmationDialogCheckMessage (containedText) {
        E2EGlobal.waitSomeTime();
        expect(browser.getText("div#confirmDialog"), "Check confirmation messagebox contains text")
            .to.contain(containedText);
    };

    static confirmationDialogAnswer (pressOK) {
        E2EGlobal.waitSomeTime(1250); // give dialog animation time
        browser.waitForVisible('#confirmationDialogOK', 1000);
        if (pressOK) {
            E2EGlobal.clickWithRetry("#confirmationDialogOK");
        } else {
            E2EGlobal.clickWithRetry("#confirmationDialogCancel");
        }
        E2EGlobal.waitSomeTime(1250); // give dialog animation time
    };

    static resetPassword(emailAdress) {
        E2EGlobal.clickWithRetry("#at-forgotPwd");
        browser.setValue('#at-field-email', emailAdress);
        E2EGlobal.clickWithRetry('#at-btn');
    }
}

E2EApp._currentlyLoggedInUser = "";
