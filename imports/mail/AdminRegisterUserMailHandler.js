import { Meteor } from 'meteor/meteor';

import { MailFactory } from './MailFactory';
import { GlobalSettings } from '../config/GlobalSettings';
import { i18n } from 'meteor/universe:i18n';

export class AdminRegisterUserMailHandler {
    constructor(newUserId, includePassword, password) {
        this._includePassword = includePassword;
        this._password = password;
        this._user = Meteor.users.findOne(newUserId);
        if (!this._user) {
            throw new Meteor.Error('Send Admin Mail', 'Could not find user: '+newUserId);
        }
    }

    send() {
        let emails = Meteor.user().emails;
        let adminFrom = (emails && emails.length > 0)
            ? emails[0].address
            : GlobalSettings.getDefaultEmailSenderAddress();

        if (this._user.emails && this._user.emails.length > 0) {
            let mailParams = {
                userLongName: this._user.profile.name,
                rootURL: GlobalSettings.getRootUrl(),
                userName: this._user.username,
                passwordParagraph: this._includePassword ?
                    i18n.__('Mail.AdminRegisterNewUser.passwordParagraph', {password: this._password}) :
                    i18n.__('Mail.AdminRegisterNewUser.passwordNotSend'),
                url4Minitz: 'https://github.com/4minitz/4minitz'
            };

            let mailer = MailFactory.getMailer(adminFrom, this._user.emails[0].address);
            mailer.setSubject('[4Minitz] '+i18n.__('Mail.AdminRegisterNewUser.subject'));
            mailer.setText(i18n.__('Mail.AdminRegisterNewUser.body', mailParams));
            mailer.send();
        } else {
            console.error('Could not send admin register mail. User has no mail address: '+this._user._id);
        }
    }
}
