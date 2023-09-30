import { E2EGlobal } from "./E2EGlobal";
import { E2EApp } from "./E2EApp";

export class E2EAdmin {
  static getAdminRoute() {
    return "admin";
  }
  static selectorMap = {
    tabUsers: "#tabAdminUsers",
    tabMessages: "#tabAdminMessages",

    btnRegisterNewUser: "#btnAdminRegisterNewUser",
    inpNewUser_username: "#id_newUsrName",
    inpNewUser_longname: "#id_newUsrLongName",
    inpNewUser_email: "#id_newUsrMail",
    inpNewUser_password1: "#id_newUsrPassword1",
    inpNewUser_password2: "#id_newUsrPassword2",
    btnNewUser_Save: "#btnRegisterUserSave",

    inpFilterUsers: "#id_adminFilterUsers",
    labShowInactiveUsers: "label[for='id_adminShowInactive']",
    chkShowInactiveUsers: "#id_adminShowInactive",
    btnToggleUserInactive: "#id_ToggleInactive",

    inpNewMessage: "#id_adminMessage",
    dlgAllMessages: "#broadcastMessage.modal",
    btnDismissAllMessages: "#btnDismissBroadcast",
  };

  static clickAdminMenu() {
    if (E2EApp.isLoggedIn()) {
      E2EGlobal.clickWithRetry("#navbar-usermenu");
      if (browser.isExisting("#navbar-admin")) {
        E2EGlobal.clickWithRetry("#navbar-admin");
        E2EGlobal.waitSomeTime();
        return true;
      }
      E2EGlobal.clickWithRetry("#navbar-usermenu"); // close open menu
    }
    return false;
  }

  static isOnAdminView() {
    return Boolean(
      browser.getUrl().includes(E2EAdmin.getAdminRoute()) &&
        browser.isVisible(E2EAdmin.selectorMap.btnRegisterNewUser),
    );
  }

  static switchToTab(tabName) {
    if (tabName === "Users") {
      E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.tabUsers);
    } else if (tabName === "Messages") {
      E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.tabMessages);
    } else {
      throw new Exception("Unknown admin tab: " + tabName);
    }
    E2EGlobal.waitSomeTime(600);
  }

  static setShowInactive(showInactive) {
    if (
      showInactive !==
      E2EGlobal.isCheckboxSelected(E2EAdmin.selectorMap.chkShowInactiveUsers)
    ) {
      // With material design we can only toggle a checkbox via click on it's label
      E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.labShowInactiveUsers);
      E2EGlobal.waitSomeTime();
    }
  }

  static filterForUser(username) {
    browser.setValue(E2EAdmin.selectorMap.inpFilterUsers, username);
  }

  static toggleUserActiveState(index) {
    if (index === undefined) {
      index = 1;
    }
    let selector =
      E2EAdmin.selectorMap.btnToggleUserInactive + ":nth-child(" + index + ")";
    E2EGlobal.clickWithRetry(selector);
    E2EGlobal.waitSomeTime();
  }

  static sendNewBroadcastMessage(message) {
    E2EAdmin.switchToTab("Messages");
    browser.setValue(E2EAdmin.selectorMap.inpNewMessage, message);
    browser.keys(["Enter"]);
    E2EGlobal.waitSomeTime(500);
  }

  static registerNewUser(username, longname, email, password) {
    E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnRegisterNewUser);
    E2EGlobal.waitSomeTime(500);

    browser.setValue(E2EAdmin.selectorMap.inpNewUser_username, username);
    browser.setValue(E2EAdmin.selectorMap.inpNewUser_longname, longname);
    browser.setValue(E2EAdmin.selectorMap.inpNewUser_email, email);
    browser.setValue(E2EAdmin.selectorMap.inpNewUser_password1, password);
    browser.setValue(E2EAdmin.selectorMap.inpNewUser_password2, password);

    E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnNewUser_Save);
    E2EGlobal.waitSomeTime(500);
  }
}
