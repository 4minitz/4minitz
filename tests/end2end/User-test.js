import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EUser } from "./helpers/E2EUser";

describe("User Profile/Password editing", () => {
  const waitUntilTimeout = 10000;

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  it("Buttons Change Password and Edit Profile are not visible for an LDAP user", () => {
    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;

    E2EApp.loginLdapUserWithCredentials("ldapUser1", "ldapPwd1", false);
    expect(E2EApp.isLoggedIn()).to.be.true;

    if (E2EApp.isLoggedIn()) {
      E2EGlobal.clickWithRetry("#navbar-usermenu");
      browser.waitUntil(
        (_) => !browser.isVisible("#navbar-dlgChangedPassword"),
      );
      expect(browser.isVisible("#navbar-dlgEditProfile")).to.be.false;
    }
    E2EGlobal.clickWithRetry("#navbar-usermenu");

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2EApp.loginUser();
  });

  it("User can successfully change his password", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const newPassword = "Test12";
    const oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];

    const changePassword = (oldPassword, newPassword) => {
      E2EGlobal.clickWithRetry("#navbar-usermenu");
      E2EGlobal.waitSomeTime();
      E2EGlobal.clickWithRetry("#navbar-dlgChangePassword");
      E2EGlobal.waitSomeTime();
      E2EUser.changePassword(oldPassword, newPassword, newPassword);
    };
    //change password to new one
    changePassword(oldPassword, newPassword);

    browser.waitUntil(
      (_) => !browser.isVisible("#frmDlgChangePassword"),
      waitUntilTimeout,
    );

    //try ty to log in with new password
    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2EApp.loginUserWithCredentials(
      E2EGlobal.SETTINGS.e2eTestUsers[0],
      newPassword,
      false,
    );
    expect(E2EApp.isLoggedIn()).to.be.true;
    //reset password to the old one
    changePassword(newPassword, oldPassword);

    browser.waitUntil(
      (_) => !browser.isVisible("#frmDlgChangePassword"),
      waitUntilTimeout,
    );
  });

  it("User can not change his password, if new Passwords are not equal", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgChangePassword");
    E2EGlobal.waitSomeTime();
    const oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
    E2EUser.changePassword(oldPassword, "TTest12", "Test12");

    browser.waitUntil(
      (_) => browser.isVisible("#frmDlgChangePassword"),
      waitUntilTimeout,
    );
    E2EGlobal.clickWithRetry("#btnChangePasswordCancel");
  });

  it("User can not change his password, if he typed his old password incorrect", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgChangePassword");
    E2EGlobal.waitSomeTime();
    const oldPassword = "4Minitz!";
    E2EUser.changePassword(oldPassword, "Test12", "Test12");
    browser.waitUntil(
      (_) => browser.isVisible("#frmDlgChangePassword"),
      waitUntilTimeout,
    );
    E2EGlobal.clickWithRetry("#btnChangePasswordCancel");
    E2EGlobal.waitSomeTime();
  });

  it("User can not change his password, if his new password is not valid due to guidelines", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgChangePassword");
    E2EGlobal.waitSomeTime();
    const oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
    E2EUser.changePassword(oldPassword, "test12", "test12");
    browser.waitUntil(
      (_) => browser.isVisible("#frmDlgChangePassword"),
      waitUntilTimeout,
    );
    E2EGlobal.clickWithRetry("#btnChangePasswordCancel");
    E2EGlobal.waitSomeTime();
  });

  it("User can successefully change his profile", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const longName = "longname";
    const email = "test@test.de";
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgEditProfile");
    E2EGlobal.waitSomeTime();
    E2EUser.editProfile(longName, email);
    browser.waitUntil(
      (_) => !browser.isVisible("#frmDlgEditProfile"),
      waitUntilTimeout,
    );
    expect(E2EUser.checkProfileChanged(longName, email).value).to.be.true;
  });

  it("User can not save his profile with an invalid Email", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const longName = "longname";
    const email = "testtest.de";
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgEditProfile");
    E2EGlobal.waitSomeTime();
    E2EUser.editProfile(longName, email);
    browser.waitUntil(
      (_) => browser.isVisible("#frmDlgEditProfile"),
      waitUntilTimeout,
    );
    expect(E2EUser.checkProfileChanged(longName, email).value).to.be.false;
  });

  it("User profile is not changed, if pressing Cancel", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const longName = "cancellongname";
    const email = "canceltest@test.de";
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgEditProfile");
    E2EGlobal.waitSomeTime();
    E2EUser.editProfile(longName, email, false);

    E2EGlobal.clickWithRetry("#btnEditProfileCancel");
    browser.waitUntil(
      (_) => !E2EUser.checkProfileChanged(longName, email).value,
      waitUntilTimeout,
    );
  });

  it("User can save his profile with an empty LongName", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const longName = "";
    const email = "test@test.de";
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgEditProfile");
    E2EGlobal.waitSomeTime();
    E2EUser.editProfile(longName, email);
    browser.waitUntil(
      (_) => E2EUser.checkProfileChanged(longName, email).value,
      waitUntilTimeout,
    );
  });

  it("User can not save his profile with an empty Email", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const longName = "longname";
    const email = "";
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgEditProfile");
    E2EGlobal.waitSomeTime();
    E2EUser.editProfile(longName, email);
    E2EGlobal.waitUntil(
      (_) => !E2EUser.checkProfileChanged(longName, email).value,
      waitUntilTimeout,
    );
  });

  it("User can change his longname without editing his Email", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const longName = "longnameChanged";
    const email = E2EUser.getUserEmail();
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#navbar-dlgEditProfile");
    E2EGlobal.waitSomeTime();
    E2EUser.editProfile(longName, email);
    E2EGlobal.waitUntil(
      (_) => !E2EUser.checkProfileChanged(longName, email).value,
      waitUntilTimeout,
    );
  });

  it("Clicking the back button closes the password change dialog", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2EGlobal.clickWithRetry("#navbar-usermenu");
    browser.waitForVisible("#navbar-dlgEditProfile");

    E2EGlobal.clickWithRetry("#navbar-dlgEditProfile");
    browser.waitForVisible("#dlgEditProfile");

    browser.back();

    const waitForInvisible = true;
    browser.waitForVisible("#dlgEditProfile", 10000, waitForInvisible);
  });
});
