import { E2EGlobal } from "./E2EGlobal";

export class E2EUser {
  static changePassword(oldPassword, newPassword1, newPassword2) {
    E2EGlobal.setValueSafe("input#id_oldPassword", oldPassword);
    E2EGlobal.setValueSafe("input#id_newPassword1", newPassword1);
    E2EGlobal.setValueSafe("input#id_newPassword2", newPassword2);

    browser.keys(["Enter"]);
  }

  static editProfile(longName, eMail, saveParameter = true) {
    E2EGlobal.setValueSafe("input#id_longName", longName);
    E2EGlobal.setValueSafe("input#id_emailAddress", eMail);
    if (saveParameter) {
      browser.keys(["Enter"]);
    }
    E2EGlobal.waitSomeTime();
  }

  static checkProfileChanged(longName, email) {
    return browser.execute(
      (longName, email) => {
        let profileChanged = false;

        if (
          (!Meteor.user().profile || Meteor.user().profile.name === longName) &&
          Meteor.user().emails[0].address === email
        ) {
          profileChanged = true;
        }
        return profileChanged;
      },
      longName,
      email,
    );
  }

  static getUserEmail() {
    return browser.execute(() => Meteor.user().emails[0].address).value;
  }
}
