import {Meteor} from "meteor/meteor";
import {i18n} from "meteor/universe:i18n";

import {GlobalSettings} from "../config/GlobalSettings";

import {MailFactory} from "./MailFactory";

export class AdminNewVersionMailHandler {
  constructor(myVersion, masterVersion, masterMessage) {
    this._myVersion = myVersion;
    this._masterVersion = masterVersion;
    // Build text for version hint messages
    this._masterMessageTxt = "";
    Object.keys(masterMessage).map((msgVersion) => {
      this._masterMessageTxt = this._masterMessageTxt + "\n* Version " +
                               msgVersion + ":\n" + masterMessage[msgVersion] +
                               "\n";
    });
    if (this._masterMessageTxt !== "") {
      this._masterMessageTxt = `Version Hints:\n${this._masterMessageTxt}\n`;
    }
  }

  send() {
    let adminFrom = GlobalSettings.getDefaultEmailSenderAddress();

    let admins = Meteor.users.find({isAdmin : true}).fetch();
    if (GlobalSettings.isEMailDeliveryEnabled() && admins.length > 0) {
      let mailParams = {
        rootUrl : GlobalSettings.getRootUrl(),
        myVersion : this._myVersion,
        masterVersion : this._masterVersion,
        urlReleaseNotes : "https://github.com/4minitz/4minitz/releases",
        masterMessageText : this._masterMessageTxt,
        url4Minitz : "https://github.com/4minitz/4minitz",
      };
      let adminMails = [];
      admins.map((adm) => { adminMails.push(adm.emails[0].address); });
      let mailer = MailFactory.getMailer(adminFrom, adminMails.join(","));
      mailer.setSubject(`[4Minitz] ${i18n.__("Mail.AdminNewVersion.subject")}`);
      mailer.setText(i18n.__("Mail.AdminNewVersion.body", mailParams));
      mailer.send();
    } else {
      console.error(
          "Could not send admin new version mail. Mail is disabled or no admins specified.",
      );
    }
  }
}
