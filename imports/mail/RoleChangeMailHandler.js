/**
 * Created by Simon on 25.05.2017.
 */
import { Meteor } from 'meteor/meteor';

import { MailFactory } from './MailFactory'
import { GlobalSettings } from '../config/GlobalSettings'
import {UserRoles as userroles} from "../userroles";

export class RoleChangeMailHandler {
    constructor(userId, oldRole, newRole, moderator, meetingSeriesId) {
        this._oldRole = oldRole;
        this._newRole = newRole;
        this._moderator = moderator;
        this._meetingSeriesId = meetingSeriesId;
        this._user = Meteor.users.findOne(userId);
        if (!this._user) {
            throw new Meteor.Error("Send Role Change Mail", "Could not find user: "+ userId);
        }
    }

    send() {
        let emailFrom = Meteor.user().emails;
        emailFrom = this._moderator.emails;
        let adminFrom = (emailFrom && emailFrom.length > 0)
            ? emailFrom[0].address
            : GlobalSettings.getDefaultEmailSenderAddress();

        let emailTo = this._user.emails[0].address;


        let oldUserRole;
        let newUserRole;
        if(this._oldRole === undefined) {
            oldUserRole = "None";
        } else {
            oldUserRole = userroles.role2Text(this._oldRole);
        }

        if(this._newRole === undefined) {
            newUserRole = "None";
        } else {
            newUserRole = userroles.role2Text(this._newRole);
        }

        let name = "";
        if(this._user.profile === undefined) {
            name = this._user.username;
        }
        else {
            name =  this._user.profile.name;
        }

        console.log("Hello " + name + ", \n"+
            "Your role in this Meeting changed: " + GlobalSettings.getRootUrl("meetingseries/" + this._meetingSeriesId) + "\n"+
            "Your old role was          : " +  oldUserRole + "\n"+
            "Your new role is           : " +  newUserRole + "\n"+
            "The change was performed by: " + this._moderator.username);

        if (this._user.emails && this._user.emails.length > 0) {
            let mailer = MailFactory.getMailer(adminFrom, emailTo);
            mailer.setSubject("Your role changed");
            mailer.setText("Hello " + name + ", \n"+
                "Your role in this Meeting changed: " + GlobalSettings.getRootUrl("meetingseries/" + this._meetingSeriesId) + "\n"+
                "Your old role was          : " + this._oldRole + "\n"+
                "Your new role is           : " + this._newRole + "\n"+
                "The change was performed by: " + this._moderator + "\n"  +

                "\n" +
                "Your Admin.\n" +
                "\n" +
                "\n" +
                "--- \n" +
                "4Minitz is free open source developed by the 4Minitz team.\n" +
                "Source is available at https://github.com/4minitz/4minitz\n"
            );

            mailer.send();
        } else {
            console.error("Could not send admin register mail. User has no mail address: "+this._user._id);
        }
    }
}