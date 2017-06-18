import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EUser } from './helpers/E2EUser'


describe('@watch User Profile/Password editing', function () {

    const waitUntilTimeout = 10000;

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });


    it('Buttons Change Password and Edit Profile are not visible for an LDAP user', function () {
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;

        E2EApp.loginLdapUserWithCredentials('ldapUser1', 'ldapPwd1', false);
        expect(E2EApp.isLoggedIn()).to.be.true;

        if (E2EApp.isLoggedIn()) {
            browser.click('#navbar-usermenu');
            browser.waitUntil(_ => !browser.isVisible('#navbar-dlgChangedPassword'));
            expect(browser.isVisible('#navbar-dlgEditProfile')).to.be.false;
        }
        browser.click('#navbar-usermenu');

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2EApp.loginUser();
    });

    it('User can successfully change his password', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        let newPassword = 'Test12';
        let oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];

        let changePassword = (oldPassword, newPassword) => {
            browser.click('#navbar-usermenu');
            E2EGlobal.waitSomeTime();
            browser.click('#navbar-dlgChangePassword');
            E2EGlobal.waitSomeTime();
            E2EUser.changePassword(oldPassword, newPassword, newPassword);
        };
        //change password to new one
        changePassword(oldPassword, newPassword);

        browser.waitUntil(_ => !browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);

        //try ty to log in with new password
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2EApp.loginUserWithCredentials(E2EGlobal.SETTINGS.e2eTestUsers[0], newPassword, false);
        expect(E2EApp.isLoggedIn()).to.be.true;
        //reset password to the old one
        changePassword(newPassword, oldPassword);

        browser.waitUntil(_ => !browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);
    });

    it('User can not change his password, if new Passwords are not equal', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgChangePassword');
        E2EGlobal.waitSomeTime();
        let oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
        E2EUser.changePassword(oldPassword, 'TTest12', 'Test12');

        browser.waitUntil(_ => browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);
        browser.click('#btnChangePasswordCancel');
    });

    it('User can not change his password, if he typed his old password incorrect', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgChangePassword');
        E2EGlobal.waitSomeTime();
        let oldPassword = '4Minitz!';
        E2EUser.changePassword(oldPassword, 'Test12', 'Test12');
        browser.waitUntil(_ => browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);
        browser.click('#btnChangePasswordCancel');
        E2EGlobal.waitSomeTime();
    });

    it('User can not change his password, if his new password is not valid due to guidelines', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgChangePassword');
        E2EGlobal.waitSomeTime();
        let oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
        E2EUser.changePassword(oldPassword, 'test12', 'test12');
        browser.waitUntil(_ => browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);
        browser.click('#btnChangePasswordCancel');
        E2EGlobal.waitSomeTime();
    });

    it('User can successefully change his profile', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        let longName = 'longname';
        let email = 'test@test.de';
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgEditProfile');
        E2EGlobal.waitSomeTime();
        E2EUser.editProfile(longName, email);
        browser.waitUntil(_ => !browser.isVisible('#frmDlgEditProfile'), waitUntilTimeout);
        expect(E2EUser.checkProfileChanged(longName, email).value).to.be.true;
    });

    it('User can not save his profile with an invalid Email', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        let longName = 'longname';
        let email = 'testtest.de';
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgEditProfile');
        E2EGlobal.waitSomeTime();
        E2EUser.editProfile(longName, email);
        browser.waitUntil(_ => browser.isVisible('#frmDlgEditProfile'), waitUntilTimeout);
        expect(E2EUser.checkProfileChanged(longName, email).value).to.be.false;
    });

    it('User profile is not changed, if pressing Cancel', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        let longName = 'cancellongname';
        let email = 'canceltest@test.de';
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgEditProfile');
        E2EGlobal.waitSomeTime();
        E2EUser.editProfile(longName, email, false);

        browser.click('#btnEditProfileCancel');
        browser.waitUntil(_ => !E2EUser.checkProfileChanged(longName,email).value, waitUntilTimeout);
    });

    it('User can save his profile with an empty LongName', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        let longName = '';
        let email = 'test@test.de';
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgEditProfile');
        E2EGlobal.waitSomeTime();
        E2EUser.editProfile(longName, email);
        browser.waitUntil(_ => E2EUser.checkProfileChanged(longName,email).value, waitUntilTimeout);
    });

    it('User can not save his profile with an empty Email', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        let longName = 'longname';
        let email = '';
        browser.click('#navbar-usermenu');
        E2EGlobal.waitSomeTime();
        browser.click('#navbar-dlgEditProfile');
        E2EGlobal.waitSomeTime();
        E2EUser.editProfile(longName, email);
        E2EGlobal.waitUntil(_ => !E2EUser.checkProfileChanged(longName,email).value, waitUntilTimeout);
    });
});
