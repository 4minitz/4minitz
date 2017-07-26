/**
 * Created by Simon on 25.05.2017.
 */
import { Meteor } from 'meteor/meteor';

import { MailFactory } from './MailFactory';
import { GlobalSettings } from '../config/GlobalSettings';
import {UserRoles as userroles} from '../userroles';
import {MeetingSeries} from '../meetingseries';

export class RoleChangeMailHandler {
    constructor(userId, oldRole, newRole, moderator, meetingSeriesId) {
        this._oldRole = oldRole;
        this._newRole = newRole;
        this._moderator = moderator;
        this._meetingSeriesId = meetingSeriesId;
        this._user = Meteor.users.findOne(userId);
        if (!this._user) {
            throw new Meteor.Error('Send Role Change Mail', 'Could not find user: '+ userId);
        }
    }

    send() {
        let emailFrom = this._moderator.emails;
        let modFrom = (emailFrom && emailFrom.length > 0)
            ? emailFrom[0].address
            : GlobalSettings.getDefaultEmailSenderAddress();
        let emailTo = this._user.emails[0].address;

        let meetingSeries = new MeetingSeries(this._meetingSeriesId);
        let meetingProject = meetingSeries.project;
        let meetingName = meetingSeries.name;

        let userName = '';
        if(this._user.profile === undefined) {
            userName = this._user.username;
        } else {
            userName =  this._user.profile.name;
        }

        if(this._oldRole === undefined) {
            this._oldRole = 'None';
        } else {
            this._oldRole = userroles.role2Text(this._oldRole);
        }

        if(this._newRole === undefined) {
            this._newRole = 'None';
        } else {
            this._newRole = userroles.role2Text(this._newRole);
        }


        // generate mail
        if (this._user.emails && this._user.emails.length > 0) {
            let mailer = MailFactory.getMailer(modFrom, emailTo);
            mailer.setSubject(`[4Minitz] Your role has changed for ${meetingProject}:${meetingName}`);
            mailer.setText('Hello ' + userName + ', \n\n'+
                'Your role has changed for meeting series "' + meetingProject + ":" + meetingName + '\n' +
                '(' + GlobalSettings.getRootUrl('meetingseries/' + this._meetingSeriesId) + ')\n\n'+
                '    Your old role was           : ' + this._oldRole + '\n'+
                '    Your new role is            : ' + this._newRole + '\n'+
                '    The change was performed by : ' + this._moderator.username + '\n'  +
                '\n' +
                'For a comprehensive list of rights for each role see:\n' +
                'https://github.com/4minitz/4minitz/blob/master/doc/user/usermanual.md#table-of-roles-and-rights\n' +
                '\n' +
                'Your Admin.\n' +
                '\n' +
                '--- \n' +
                '4Minitz is free open source developed by the 4Minitz team.\n' +
                'Source is available at https://github.com/4minitz/4minitz\n'
            );

            mailer.send();
        } else {
            console.error('Could not send eMail for role change. User has no mail address: '+this._user._id);
        }
    }
}