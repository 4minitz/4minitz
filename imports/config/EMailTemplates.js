import { Accounts } from 'meteor/accounts-base';
import { GlobalSettings } from './GlobalSettings';
import {Meteor} from 'meteor/meteor';
import { i18n } from 'meteor/universe:i18n';

function setupEmailTemplatesForAccounts() {
    Accounts.emailTemplates.siteName = GlobalSettings.getSiteName();
    Accounts.emailTemplates.from = Accounts.emailTemplates.siteName + '<' + GlobalSettings.getDefaultEmailSenderAddress() + '>';

    Accounts.emailTemplates.verifyEmail = {
        subject() {
            return i18n.__('Mail.VerifyEmailAddress.subject', {sitename: Accounts.emailTemplates.siteName});
        },
        text(user, url) {
            let emailAddress = user.emails[0].address,
                urlWithoutHash = url.replace('#/', '');

            return i18n.__('Mail.VerifyEmailAddress.body', {emailAddress: emailAddress, urlWithoutHash: urlWithoutHash});
        }
    };

    Accounts.emailTemplates.resetPassword = {
        subject() {
            return i18n.__('Mail.ResetPassword.subject', {sitename: Accounts.emailTemplates.siteName});
        },
        text(user, url) {
            let emailAddress = user.emails[0].address,
                urlWithoutHash = url.replace('#/', '');

            return i18n.__('Mail.ResetPassword.body', {emailAddress: emailAddress, urlWithoutHash: urlWithoutHash});
        }
    };

}

// Attention! We can't use GlobalSettings.isEMailDeliveryEnabled() here,
// as public GlobalSettings are not yet published when we run the following code
if (Meteor.settings.email.enableMailDelivery) {
    setupEmailTemplatesForAccounts();
}
