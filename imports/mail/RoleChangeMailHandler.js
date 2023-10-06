import { Meteor } from "meteor/meteor";

import { MailFactory } from "./MailFactory";
import { GlobalSettings } from "../config/GlobalSettings";
import { UserRoles as userroles } from "../userroles";
import { MeetingSeries } from "../meetingseries";
import { User } from "/imports/user";
import { i18n } from "meteor/universe:i18n";

export class RoleChangeMailHandler {
  constructor(userId, oldRole, newRole, moderator, meetingSeriesId) {
    this._oldRole = oldRole;
    this._newRole = newRole;
    this._moderator = moderator;
    this._meetingSeriesId = meetingSeriesId;
    this._user = Meteor.users.findOne(userId);
    if (!this._user) {
      throw new Meteor.Error(
        "Send Role Change Mail",
        `Could not find user: ${userId}`,
      );
    }
  }

  send() {
    let emailFrom = this._moderator.emails;
    let modFrom =
      emailFrom && emailFrom.length > 0
        ? emailFrom[0].address
        : GlobalSettings.getDefaultEmailSenderAddress();
    let emailTo = this._user.emails[0].address;

    let meetingSeries = new MeetingSeries(this._meetingSeriesId);
    let meetingProject = meetingSeries.project;
    let meetingName = meetingSeries.name;

    let userName = User.PROFILENAMEWITHFALLBACK(this._user);

    if (this._oldRole == null) {
      // will be true for undefined OR null
      this._oldRole = "None";
    } else {
      this._oldRole = userroles.role2Text(this._oldRole);
    }

    if (this._newRole == null) {
      // will be true for undefined OR null
      this._newRole = "None";
    } else {
      this._newRole = userroles.role2Text(this._newRole);
    }

    // generate mail
    if (this._user.emails && this._user.emails.length > 0) {
      let mailer = MailFactory.getMailer(modFrom, emailTo);
      let mailParams = {
        userName: userName,
        meetingProject: meetingProject,
        meetingName: meetingName,
        meetingSeriesURL: GlobalSettings.getRootUrl(
          `meetingseries/${this._meetingSeriesId}`,
        ),
        roleOld: this._oldRole,
        roleNew: this._newRole,
        moderatorName: User.PROFILENAMEWITHFALLBACK(this._moderator),
        urlRoleDocu:
          "https://github.com/4minitz/4minitz/blob/develop/doc/user/usermanual.md#table-of-roles-and-rights",
        url4Minitz: "https://github.com/4minitz/4minitz",
      };
      mailer.setSubject(
        `[4Minitz] ${i18n.__("Mail.UserRoleChange.subject", mailParams)}`,
      );
      mailer.setText(i18n.__("Mail.UserRoleChange.body", mailParams));

      mailer.send();
    } else {
      console.error(
        `Could not send eMail for role change. User has no mail address: ${this._user._id}`,
      );
    }
  }
}
