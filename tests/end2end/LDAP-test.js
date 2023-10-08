import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";

describe("LDAP", () => {
  const aProjectName = "E2E LDAP";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;

  const getNewMeetingName = () => {
    aMeetingCounter++;
    return aMeetingNameBase + aMeetingCounter;
  };

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach("make sure test user is logged out and on the start page", () => {
    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
  });

  after("clear database and login user", () => {
    E2EApp.launchApp();
    E2EApp.loginUser();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  xit("import cronjob does not produce errors", () => {
    const numberOfUsersWithoutLdap = server.call("e2e.removeLdapUsersFromDb");

    server.call("e2e.importLdapUsers");

    const numberOfUsersAfterImport = server.call("e2e.countUsers");
    expect(numberOfUsersAfterImport).to.be.greaterThan(
      numberOfUsersWithoutLdap,
    );
  });

  it("ldap user can login with his credentials", () => {
    E2EApp.loginLdapUserWithCredentials("ldapUser1", "ldapPwd1", false);

    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  it("ldap user can NOT reset password", () => {
    E2EApp.loginLdapUserWithCredentials("ldapUser1", "ldapPwd1", false);
    E2EApp.logoutUser();

    E2EGlobal.clickWithRetry("#tab_standard");
    E2EGlobal.waitSomeTime(600);
    if (browser.isVisible("#at-forgotPwd")) {
      E2EApp.resetPassword("ldapUser1@example.com");
      E2EGlobal.waitSomeTime(1500);
      expect(browser.isVisible(".at-error"), "Error should be visible").to.be
        .true;
    } else {
      expect(
        browser.isVisible("#at-forgotPwd"),
        "Change password should be invisible",
      ).to.be.false;
    }
  });

  it("ldap user can create meeting series", () => {
    E2EApp.loginLdapUserWithCredentials("ldapUser1", "ldapPwd1", false);

    const initialCount = E2EMeetingSeries.countMeetingSeries();

    aMeetingName = getNewMeetingName();
    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

    expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to
      .be.ok;
  });

  it("ldap user will be rejected if the password is wrong", () => {
    let loginUnexpectedlySucceeded = false;
    try {
      E2EApp.loginLdapUserWithCredentials("ldapUser1", "wrongPassword", false);
      loginUnexpectedlySucceeded = true;
    } catch (e) {
      expect(e.toString()).to.include("Unknown user or wrong password.");
    }

    expect(loginUnexpectedlySucceeded).to.be.false;
    expect(E2EApp.isNotLoggedIn()).to.be.true;
  });

  it("ldap user can not log in with the standard login form", () => {
    const message =
      "Login failed for user ldapUser1 with ldapPwd1\nwith Error: Unknown user or wrong password.";

    const login = () => {
      E2EApp.loginUserWithCredentials("ldapUser1", "ldapPwd1", false);
    };

    expect(login).to.throw(message);

    expect(E2EApp.isNotLoggedIn()).to.be.true;
  });
});
