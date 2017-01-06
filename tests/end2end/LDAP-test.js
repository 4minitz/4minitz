import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';

describe('LDAP', function () {
    const aProjectName = "E2E LDAP";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    let getNewMeetingName = () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };

    before("reload page", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.launchApp();
        }
    });

    after("clear database and login user", function () {
        E2EApp.launchApp();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });
    
    beforeEach("make sure test user is logged out and on the start page", function () {
        E2EApp.logoutUser();

        expect(browser.getTitle()).to.equal('4minitz!');
        expect(E2EApp.isLoggedIn()).to.be.false;
    });

    it('ldap user can login with his credentials', function () {
        E2EApp.loginLdapUserWithCredentials('ldapUser1', 'ldapPwd1', false);

        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    it('ldap user can create meeting series', function () {
        E2EApp.loginLdapUserWithCredentials('ldapUser1', 'ldapPwd1', false);

        let initialCount = E2EMeetingSeries.countMeetingSeries();

        aMeetingName = getNewMeetingName();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });

    it('ldap user will be rejected if the password is wrong', function () {
        E2EApp.loginLdapUserWithCredentials('ldapUser1', 'wrongPassword', false);

        expect(E2EApp.isLoggedIn()).to.be.false;
    });

    it('ldap user can not log in with the standard login form', function () {
        let message = 'Login failed for user ldapUser1 with ldapPwd1\nwith Error: Unknown user or wrong password.';

        let login = () => {
            E2EApp.loginUserWithCredentials('ldapUser1', 'ldapPwd1', false);
        };

        expect(login).to.throw(message);

        expect(E2EApp.isLoggedIn()).to.be.false;
    });
});