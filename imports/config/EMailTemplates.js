import { Accounts } from 'meteor/accounts-base';
import { GlobalSettings } from './GlobalSettings';
import {Meteor} from 'meteor/meteor';

function setupEmailTemplatesForAccounts() {
    Accounts.emailTemplates.siteName = GlobalSettings.getSiteName();
    Accounts.emailTemplates.from = Accounts.emailTemplates.siteName + '<' + GlobalSettings.getDefaultEmailSenderAddress() + '>';

    Accounts.emailTemplates.verifyEmail = {
        subject() {
            return '[' + Accounts.emailTemplates.siteName + '] Verify Your Email Address';
        },
        text(user, url) {
            let emailAddress = user.emails[0].address,
                urlWithoutHash = url.replace('#/', ''),
                emailBody = 'To verify your email address ' + emailAddress + ' visit the following link:\n\n' +
                    urlWithoutHash +
                    '\n\n If you did not request this verification, please ignore this email. ' +
                    'If you feel something is wrong, please contact your admin team';

            return emailBody;
        }
    };

    Accounts.emailTemplates.resetPassword = {
        subject() {
            return '[' + Accounts.emailTemplates.siteName + '] Reset Your Password';
        },
        text(user, url) {
            let emailAddress = user.emails[0].address,
                urlWithoutHash = url.replace('#/', ''),
                emailBody = 'To reset your password for ' + emailAddress + ' visit the following link:\n\n' +
                    urlWithoutHash +
                    '\n\n If you did not request to reset your password, please ignore this email. ' +
                    'If you feel something is wrong, please contact your admin team';

            return emailBody;
        }
    };

}

// Attention! We can't use GlobalSettings.isEMailDeliveryEnabled() here,
// as public GlobalSettings are not yet published when we run the following code
if (Meteor.settings.email.enableMailDelivery) {
    setupEmailTemplatesForAccounts();
}