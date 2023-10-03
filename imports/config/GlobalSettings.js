import { Meteor } from "meteor/meteor";
import { LdapSettings } from "/imports/config/LdapSettings";
import _ from "lodash";

function getSetting(path, def = undefined) {
  return _.get(Meteor.settings, path, def);
}

/**
 * Wrapper to access our Global Settings.
 */
export class GlobalSettings {
  /**
   * Publish designated settings which should be
   * accessible for the client (e.g. enableEmailDelivery).
   * This method should be called on meteor server startup.
   * Caution: do not publish settings like api keys or passwords!
   */
  static publishSettings() {
    if (Meteor.settings.public === undefined) {
      Meteor.settings.public = {};
    }

    Meteor.settings.public.enableMailDelivery =
      Meteor.settings.email &&
      Meteor.settings.email.enableMailDelivery !== undefined
        ? Meteor.settings.email.enableMailDelivery
        : false;

    Meteor.settings.public.branding = {};
    Meteor.settings.public.branding.topLeftLogoHTML =
      Meteor.settings.branding &&
      Meteor.settings.branding.topLeftLogoHTML !== undefined
        ? Meteor.settings.branding.topLeftLogoHTML
        : "4Minitz.com";
    Meteor.settings.public.branding.showGithubCorner =
      Meteor.settings.branding &&
      Meteor.settings.branding.showGithubCorner !== undefined
        ? Meteor.settings.branding.showGithubCorner
        : true;
    Meteor.settings.public.branding.showInfoOnLogin =
      Meteor.settings.branding &&
      Meteor.settings.branding.showInfoOnLogin !== undefined
        ? Meteor.settings.branding.showInfoOnLogin
        : true;
    Meteor.settings.public.branding.createDemoAccount =
      Meteor.settings.branding &&
      Meteor.settings.branding.createDemoAccount !== undefined
        ? Meteor.settings.branding.createDemoAccount
        : false; // #Security: if this setting is not present, we will *NOT* create a demo user account!

    Meteor.settings.public.branding.legalNotice =
      Meteor.settings.branding &&
      Meteor.settings.branding.legalNotice !== undefined
        ? Meteor.settings.branding.legalNotice
        : { enabled: false, linkText: "", content: [""] };

    Meteor.settings.public.attachments = {};
    Meteor.settings.public.attachments.enabled =
      Meteor.settings.attachments &&
      Meteor.settings.attachments.enabled !== undefined
        ? Meteor.settings.attachments.enabled
        : false;

    Meteor.settings.public.attachments.allowExtensions =
      Meteor.settings.attachments &&
      Meteor.settings.attachments.allowExtensions !== undefined
        ? Meteor.settings.attachments.allowExtensions
        : ".*";
    Meteor.settings.public.attachments.denyExtensions =
      Meteor.settings.attachments &&
      Meteor.settings.attachments.denyExtensions !== undefined
        ? Meteor.settings.attachments.denyExtensions
        : "exe|app|bat|sh|cmd|com|cpl|exe|gad|hta|inf|jar|jpe|jse|lnk|msc|msh|msi|msp|pif|ps1|ps2|psc|reg|scf|scr|vbe|vbs|wsc|wsf|wsh";
    Meteor.settings.public.attachments.maxFileSize =
      Meteor.settings.attachments &&
      Meteor.settings.attachments.maxFileSize !== undefined
        ? Meteor.settings.attachments.maxFileSize
        : 10 * 1024 * 1024; // default: 10 MB

    Meteor.settings.public.docGeneration = {};
    Meteor.settings.public.docGeneration.enabled =
      Meteor.settings.docGeneration &&
      Meteor.settings.docGeneration.enabled !== undefined
        ? Meteor.settings.docGeneration.enabled
        : false;
    Meteor.settings.public.docGeneration.format =
      Meteor.settings.docGeneration &&
      Meteor.settings.docGeneration.enabled !== undefined
        ? Meteor.settings.docGeneration.format
        : "html";

    Meteor.settings.public.forbidClientAccountCreation =
      Meteor.settings.forbidClientAccountCreation !== undefined
        ? Meteor.settings.forbidClientAccountCreation
        : false;

    Meteor.settings.public.sendVerificationEmail =
      Meteor.settings.email &&
      Meteor.settings.email.sendVerificationEmail !== undefined
        ? Meteor.settings.email.sendVerificationEmail
        : false;

    Meteor.settings.public.showResendVerificationEmailLink =
      Meteor.settings.email &&
      Meteor.settings.email.showResendVerificationEmailLink !== undefined
        ? Meteor.settings.email.showResendVerificationEmailLink
        : false;

    Meteor.settings.public.showForgotPasswordLink =
      Meteor.settings.email &&
      Meteor.settings.email.showForgotPasswordLink !== undefined
        ? Meteor.settings.email.showForgotPasswordLink
        : false;

    Meteor.settings.public.isEnd2EndTest = Meteor.settings.isEnd2EndTest;

    // enforce slash "/" at the end
    if (Meteor.settings.attachments?.storagePath) {
      if (!Meteor.settings.attachments.storagePath.match(/\/$/)) {
        Meteor.settings.attachments.storagePath =
          Meteor.settings.attachments.storagePath + "/";
      }
    }

    LdapSettings.publish();
  }

  static getAdminIDs() {
    let adminIDs = [];

    if (Meteor.settings.adminIDs && Array.isArray(Meteor.settings.adminIDs)) {
      adminIDs = adminIDs.concat(Meteor.settings.adminIDs);
    }

    return adminIDs;
  }

  static forbidClientAccountCreation() {
    return getSetting("forbidClientAccountCreation", false);
  }

  static getRootUrl(path) {
    if (Meteor.settings.ROOT_URL) {
      return Meteor.absoluteUrl(path, { rootUrl: Meteor.settings.ROOT_URL });
    }

    return Meteor.absoluteUrl(path);
  }

  static hasImportUsersCronTab() {
    return Boolean(
      Meteor.settings.ldap?.enabled && Meteor.settings.ldap.importCronTab,
    );
  }

  static getImportUsersCronTab() {
    if (Meteor.settings.ldap?.enabled) {
      return Meteor.settings.ldap.importCronTab;
    }
  }

  static getImportUsersOnLaunch() {
    if (Meteor.settings.ldap?.enabled) {
      if (Meteor.settings.ldap.importOnLaunch !== undefined) {
        return Meteor.settings.ldap.importOnLaunch;
      }
      return true;
    }
    return false;
  }

  static getLDAPSettings() {
    return Meteor.settings.ldap || {};
  }

  static isTrustedIntranetInstallation() {
    // returns false instead of undefined
    return Boolean(Meteor.settings.trustedIntranetInstallation);
  }

  static getDefaultLabels() {
    if (!Meteor.settings.defaultLabels) return [];

    return Meteor.settings.defaultLabels;
  }

  static getSiteName() {
    if (!Meteor.settings.siteName) {
      return "4Minitz";
    }
    return Meteor.settings.siteName;
  }

  static getDefaultEmailSenderAddress(alternativeSender) {
    let address = Meteor.settings.email
      ? Meteor.settings.email.defaultEMailSenderAddress
      : undefined;

    if (
      address &&
      alternativeSender &&
      Meteor.settings.email &&
      Meteor.settings.email.defaultEMailSenderExceptionDomains &&
      Meteor.settings.email.defaultEMailSenderExceptionDomains.length > 0
    ) {
      let senderDomain = alternativeSender.replace(/^.*@/, "").toLowerCase(); // me@mycompany.com => mycompany.com
      for (
        let i = 0;
        i < Meteor.settings.email.defaultEMailSenderExceptionDomains.length;
        i++
      ) {
        if (
          Meteor.settings.email.defaultEMailSenderExceptionDomains[
            i
          ].toLowerCase() === senderDomain
        ) {
          address = alternativeSender;
          break;
        }
      }
    }

    if (address !== undefined) {
      // we have default from settings
      if (address === "") {
        // but it's empty!
        return alternativeSender // luckily we have a real user profile mail
          ? alternativeSender // we take it!
          : GlobalSettings.getFallbackEMailSenderAddress(); // nope. use fallback!
      } else {
        return address;
      }
    }

    throw new Meteor.Error(
      "illegal-state",
      "defaultEMailSenderAddress not defined in settings",
    );
  }

  static getFallbackEMailSenderAddress() {
    if (Meteor.settings.email?.fallbackEMailSenderAddress) {
      return Meteor.settings.email.fallbackEMailSenderAddress;
    }

    throw new Meteor.Error(
      "illegal-state",
      "fallback email sender address required but not defined in settings",
    );
  }

  static isEMailDeliveryEnabled() {
    if (!Meteor.settings.public) {
      return false;
    }
    return Meteor.settings.public.enableMailDelivery;
  }

  static getMailDeliverer() {
    if (Meteor.settings.email?.mailDeliverer) {
      return Meteor.settings.email.mailDeliverer;
    }

    return "smtp";
  }

  static sendVerificationEmail() {
    const mailEnabled = getSetting("email.enableMailDelivery", false),
      sendVerificationEmail = getSetting("email.sendVerificationEmail", false);
    return mailEnabled && sendVerificationEmail;
  }

  static showResendVerificationEmailLink() {
    const mailEnabled = getSetting("email.enableMailDelivery", false),
      showResendVerificationEmailLink = getSetting(
        "email.showResendVerificationEmailLink",
        false,
      );

    return mailEnabled && showResendVerificationEmailLink;
  }

  static showForgotPasswordLink() {
    const mailEnabled = getSetting("email.enableMailDelivery", false),
      showForgotPasswordLink = getSetting(
        "email.showForgotPasswordLink",
        false,
      );

    return mailEnabled && showForgotPasswordLink;
  }

  static getSMTPMailUrl() {
    if (Meteor.settings.email?.smtp && Meteor.settings.email.smtp.mailUrl) {
      return Meteor.settings.email.smtp.mailUrl;
    }
    return "";
  }

  static getMailgunSettings() {
    if (Meteor.settings.email?.mailgun) {
      return Meteor.settings.email.mailgun;
    }

    throw new Meteor.Error(
      "illegal-state",
      "mailgun settings not defined in meteor settings",
    );
  }

  static getBrandingLogoHTML() {
    return Meteor.settings.public.branding.topLeftLogoHTML;
  }

  static showGithubCorner() {
    return Meteor.settings.public.branding.showGithubCorner;
  }

  static showInfoOnLogin() {
    return Meteor.settings.public.branding.showInfoOnLogin;
  }

  static createDemoAccount() {
    return Meteor.settings.public.branding.createDemoAccount;
  }

  static getAttachmentsEnabled() {
    return Meteor.settings.public.attachments.enabled;
  }

  // The url is in settings file.
  static getLegalNoticeExternalUrl() {
    if (navigator.language == "de-DE")
      return Meteor.settings.public.branding.legalNotice.externalURL.de;
    return Meteor.settings.public.branding.legalNotice.externalURL.en;
  }
}
