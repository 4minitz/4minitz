
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
            browser.waitForExist('#navbar-usermenu', 2000);         // browser = WebdriverIO instance
        } catch (e) {
            // give browser some time, on fresh login
        }
        return browser.isExisting('#navbar-usermenu');
    };

    static logoutUser () {
        if (E2EApp.isLoggedIn()) {
            browser.click('#navbar-usermenu');
            browser.click('#navbar-signout');
            E2EGlobal.waitSomeTime();
        }
        E2EApp._currentlyLoggedInUser = "";
        expect(browser.getTitle()).to.equal(E2EApp.titlePrefix);
    };

    static loginLdapUserWithCredentials(username, password, autoLogout) {
        this.loginUserWithCredentials(username, password, autoLogout, '#tab_ldap');
    }

    static loginUserWithCredentials(username, password, autoLogout, tab) {
        if (autoLogout === undefined) {
            autoLogout = true;
        }

        if (tab === undefined) {
            tab = '#tab_standard';
        }

        if (autoLogout) {
            E2EApp.logoutUser();
        }
        try {    // try to log in
            browser.click(tab);
            E2EGlobal.waitSomeTime();

            let tabIsStandard = browser.isExisting('#at-field-username_and_email');
            let userWantsStandard = tab === '#tab_standard';
            let tabIsLdap = browser.isExisting('#id_ldapUsername');
            let userWantsLdap = tab === '#tab_ldap';

            if ((tabIsStandard && userWantsStandard) || (tabIsLdap && userWantsLdap)) {
                if (tabIsStandard) {
                    browser.setValue('input[id="at-field-username_and_email"]', username);
                    browser.setValue('input[id="at-field-password"]', password);
                }

                if (tabIsLdap) {
                    browser.setValue('input[id="id_ldapUsername"]', username);
                    browser.setValue('input[id="id_ldapPassword"]', password);
                }

                browser.keys(['Enter']);
                E2EGlobal.waitSomeTime();

                if (browser.isExisting('.at-error.alert.alert-danger')) {
                    throw new Error ("Unknown user or wrong password.")
                }
                E2EApp.isLoggedIn();
                E2EApp._currentlyLoggedInUser = username;
            }
        } catch (e) {
            throw new Error (`Login failed for user ${username} with ${password}\nwith ${e}`);
        }
    }

    /**
     * Logout current user, if necessary, then login a specific test user
     * @param index of test user from setting. optional.
     * @param autoLogout perform logout before login the test user. optional.
     */
    static loginUser (index, autoLogout) {
        if (!index) {
            index = 0;
        }

        let aUser = E2EGlobal.SETTINGS.e2eTestUsers[index];
        let aPassword = E2EGlobal.SETTINGS.e2eTestPasswords[index];

        this.loginUserWithCredentials(aUser, aPassword, autoLogout);
    };

    static getCurrentUser () {
        return E2EApp._currentlyLoggedInUser;
    };
    
    static launchApp () {
        browser.url(E2EGlobal.SETTINGS.e2eUrl);

        if (browser.getTitle() != E2EApp.titlePrefix) {
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
        if (! E2EApp.isOnStartPage()) {
            E2EGlobal.saveScreenshot("gotoStartPage1");
            browser.click('a.navbar-brand');
            E2EGlobal.waitSomeTime(1500);
        }
        if (! E2EApp.isOnStartPage()) {
            E2EGlobal.saveScreenshot("gotoStartPage2");
        }
        expect(browser.getTitle()).to.equal(E2EApp.titlePrefix);
        expect (E2EApp.isOnStartPage(), "gotoStartPage()").to.be.true;
    };

    static confirmationDialogCheckMessage (containedText) {
        E2EGlobal.waitSomeTime();
        expect(browser.getText("div#confirmDialog"), "Check confirmation messagebox contains text")
            .to.contain(containedText);
    };

    static confirmationDialogAnswer (pressOK, title) {
        E2EGlobal.waitSomeTime(1250); // give dialog animation time
        browser.waitForVisible('#confirmationDialogOK', 1000);
        if (pressOK) {
            browser.click("#confirmationDialogOK");
        } else {
            browser.click("#confirmationDialogCancel");
        }
        E2EGlobal.waitSomeTime(1250); // give dialog animation time
    };
}

E2EApp._currentlyLoggedInUser = "";

