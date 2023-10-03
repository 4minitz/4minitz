import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMails } from "./helpers/E2EMails";

import { E2EAdmin } from "./helpers/E2EAdmin";

describe("Admin View", function () {
  before("reload page and reset app", function () {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach(
    "goto start page and make sure test user is logged in",
    function () {
      server.call("e2e.removeAllBroadcasts");
      E2EApp.launchApp();
      E2EApp.loginUser(0);
      expect(E2EApp.isLoggedIn()).to.be.true;
    },
  );

  after("log in user1", function () {
    server.call("e2e.removeAllBroadcasts");
    E2EApp.launchApp();
    E2EApp.loginUser(0, true);
  });

  it("can not access admin menu or route for non-admin user", function () {
    expect(E2EAdmin.clickAdminMenu(), "click admin menu").to.be.false;

    browser.url(browser.getUrl() + E2EAdmin.getAdminRoute());
    E2EGlobal.waitSomeTime();
    expect(E2EAdmin.isOnAdminView(), "! isOnAdminView").to.be.false;
  });

  it("can access admin menu for admin user", function () {
    E2EApp.loginUser(4, true);
    expect(E2EAdmin.clickAdminMenu(), "click admin menu").to.be.true;
    expect(E2EAdmin.isOnAdminView(), "isOnAdminView").to.be.true;
    E2EApp.loginUser(0, true);
  });

  // #Security: Inactive users shall not be able to log in.
  it("can toggle a user to in-active. In-active user cannot sign in.", function () {
    E2EApp.loginUser("admin", true);
    E2EAdmin.clickAdminMenu();
    E2EAdmin.switchToTab("Users");
    E2EAdmin.setShowInactive(true);

    let testUser = "user2";
    E2EAdmin.filterForUser(testUser + "@4min"); // the '@' actually searches in mail address. This prevents 'ldapuser1' to show up
    expect(browser.getText("#id_adminUserTable tbody tr")).to.contain("Active");
    E2EAdmin.toggleUserActiveState(1); // toggle 1st visible user!
    expect(browser.getText("#id_adminUserTable tbody tr")).to.contain(
      "Inactive",
    );

    let loginSuccess = false;
    try {
      E2EApp.loginUser(testUser, true);
      loginSuccess = true;
    } catch (e) {
      expect(String(e)).to.contain("wrong password");
    }
    expect(loginSuccess, "loginSuccess should be false, as user is in-active")
      .to.be.false;
  });

  it("can toggle a user back to active. Active user can sign in, again.", function () {
    E2EApp.loginUser("admin", true);
    E2EAdmin.clickAdminMenu();
    E2EAdmin.switchToTab("Users");
    E2EAdmin.setShowInactive(true);

    let testUser = "user2";
    E2EAdmin.filterForUser(testUser + "@4min"); // the '@' actually searches in mail address. This prevents 'ldapuser1' to show up
    expect(browser.getText("#id_adminUserTable tbody tr")).to.contain(
      "Inactive",
    );
    E2EAdmin.toggleUserActiveState(1); // toggle 1st visible user!
    expect(browser.getText("#id_adminUserTable tbody tr")).to.contain("Active");

    E2EApp.loginUser(testUser, true);
    expect(E2EApp.isLoggedIn(), "user is logged in").to.be.true;
  });

  it("can broadcast a message and dismiss it", function () {
    E2EApp.loginUser("admin", true);
    E2EAdmin.clickAdminMenu();

    // admin sends broadcast message
    let message = "Hello from admin!";
    expect(
      browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages),
      "message dialog should be invisible for admin",
    ).to.be.false;
    E2EAdmin.sendNewBroadcastMessage(message);
    browser.waitForVisible(E2EAdmin.selectorMap.dlgAllMessages, 2000);
    expect(
      browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages),
      "message dialog should be visible for admin",
    ).to.be.true;
    expect(
      browser.getText(E2EAdmin.selectorMap.dlgAllMessages),
      "check broadcast message text",
    ).to.contain(message);

    // Dismiss by admin user
    E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnDismissAllMessages);
    const isNotVisible = true;
    browser.waitForVisible(
      E2EAdmin.selectorMap.dlgAllMessages,
      2000,
      isNotVisible,
    );
    expect(
      browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages),
      "message dialog should be invisible for admin after dismiss",
    ).to.be.false;

    // Now check display & dismiss by normal user
    E2EApp.loginUser("user1", true);
    browser.waitForVisible(E2EAdmin.selectorMap.dlgAllMessages, 3000);
    E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnDismissAllMessages);
    const waitForInvisible = true;
    browser.waitForVisible(
      E2EAdmin.selectorMap.dlgAllMessages,
      3000,
      waitForInvisible,
    );
    expect(
      browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages),
      "message dialog should be visible for admin",
    ).to.be.false;
  });

  it("can register a new user", function () {
    E2EApp.loginUser("admin", true);
    E2EAdmin.clickAdminMenu();

    let username = "newuser";
    let longname = "New User";
    let email = "newuser@4minitz.com";
    let password = "NewNew1";
    E2EAdmin.registerNewUser(username, longname, email, password);

    // check EMail sent to new user
    let sentMails = E2EMails.getAllSentMails();
    expect(sentMails, "one mail should be sent").to.have.length(1);
    let sentMail = sentMails[0];
    expect(sentMail.to, "the email should contain to: mail").to.equal(email);
    expect(sentMail.text, "the email should contain username").to.contain(
      username,
    );
    expect(sentMail.text, "the email should contain long name").to.contain(
      longname,
    );
    expect(sentMail.text, "the email should contain password").to.contain(
      password,
    );

    // check if new user can sign in
    E2EApp.loginUserWithCredentials(username, password, true);
    expect(E2EApp.isLoggedIn(), "user is logged in").to.be.true;
  });
});
