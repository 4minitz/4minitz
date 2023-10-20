import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";

import { GlobalSettings } from "./GlobalSettings";

function setupEmailTemplatesForAccounts() {
  Accounts.emailTemplates.siteName = GlobalSettings.getSiteName();
  Accounts.emailTemplates.from = `${
    Accounts.emailTemplates.siteName
  }<${GlobalSettings.getDefaultEmailSenderAddress()}>`;

  Accounts.emailTemplates.verifyEmail = {
    subject() {
      return i18n.__("Mail.VerifyEmailAddress.subject", {
        sitename: Accounts.emailTemplates.siteName,
      });
    },
    text(user, url) {
      const emailAddress = user.emails[0].address;
      const urlWithoutHash = url.replace("#/", "");

      return i18n.__("Mail.VerifyEmailAddress.body", {
        emailAddress,
        urlWithoutHash,
      });
    },
  };

  Accounts.emailTemplates.resetPassword = {
    subject() {
      return i18n.__("Mail.ResetPassword.subject", {
        sitename: Accounts.emailTemplates.siteName,
      });
    },
    text(user, url) {
      const emailAddress = user.emails[0].address;
      const urlWithoutHash = url.replace("#/", "");

      return i18n.__("Mail.ResetPassword.body", {
        emailAddress,
        urlWithoutHash,
      });
    },
  };
}

// Attention! We can't use GlobalSettings.isEMailDeliveryEnabled() here,
// as public GlobalSettings are not yet published when we run the following code
if (Meteor.settings.email.enableMailDelivery) {
  setupEmailTemplatesForAccounts();
}
