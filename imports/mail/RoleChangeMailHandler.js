import { User } from "/imports/user";
import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";

import { GlobalSettings } from "../config/GlobalSettings";
import { MeetingSeries } from "../meetingseries";
import { UserRoles as userroles } from "../userroles";

import { MailFactory } from "./MailFactory";

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
    const emailFrom = this._moderator.emails;
    const modFrom =
      emailFrom && emailFrom.length > 0
        ? emailFrom[0].address
        : GlobalSettings.getDefaultEmailSenderAddress();
    const emailTo = this._user.emails[0].address;

    const meetingSeries = new MeetingSeries(this._meetingSeriesId);
    const meetingProject = meetingSeries.project;
    const meetingName = meetingSeries.name;

    const userName = User.PROFILENAMEWITHFALLBACK(this._user);

    this._oldRole =
      this._oldRole == null ? "None" : userroles.role2Text(this._oldRole);

    this._newRole =
      this._newRole == null ? "None" : userroles.role2Text(this._newRole);

    // generate mail
    if (this._user.emails && this._user.emails.length > 0) {
      const mailer = MailFactory.getMailer(modFrom, emailTo);
      const mailParams = {
        userName,
        meetingProject,
        meetingName,
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
      return;
    }
    console.error(
      `Could not send eMail for role change. User has no mail address: ${this._user._id}`,
    );
  }
}
