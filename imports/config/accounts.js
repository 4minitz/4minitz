import { GlobalSettings } from "/imports/config/GlobalSettings";
import { LdapSettings } from "/imports/config/LdapSettings";
import { I18nHelper } from "/imports/helpers/i18n";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { T9n } from "meteor/softwarerero:accounts-t9n";
import { i18n } from "meteor/universe:i18n";
import { AccountsTemplates } from "meteor/useraccounts:core";

// For possible account configuration see:
// https://github.com/meteor-useraccounts/core/blob/master/Guide.md#configuration-api

// Regarding localization: displayName, placeholder, and errStr can also be an
// accounts-t9n registered key, in which case it will be translated based on the
// currently selected language. In case you'd like to specify a key which is not
// already provided by accounts-t9n you can always map your own keys.

const availLanguages = i18n.getLanguages();

for (const lang of availLanguages) {
  T9n.map(lang, {
    custom: {
      usernamePlaceholder: i18n.__("Accounts.usernamePlaceholder", {
        _locale: lang,
      }),
      nameDisplayName: i18n.__("Accounts.nameDisplayName", { _locale: lang }),
      namePlaceholder: i18n.__("Accounts.namePlaceholder", { _locale: lang }),
      passwordPlaceholder: i18n.__("Accounts.passwordPlaceholder", {
        _locale: lang,
      }),
      passwordError: i18n.__("Accounts.passwordError", { _locale: lang }),
    },
  });
}

AccountsTemplates.removeField("password");
AccountsTemplates.removeField("email");

AccountsTemplates.addFields([
  {
    _id: "username",
    type: "text",
    displayName: "username",
    placeholder: {
      signUp: "custom.usernamePlaceholder",
    },
    required: true,
    minLength: 3,
  },
  {
    _id: "name",
    type: "text",
    displayName: "custom.nameDisplayName",
    placeholder: {
      signUp: "custom.namePlaceholder",
    },
  },
  {
    _id: "email",
    type: "email",
    required: true,
    displayName: "emailAddress",
    placeholder: {
      default: "emailAddress",
    },
    re: /^[^\s@]+@([^\s@]+){2,}\.([^\s@]+){2,}$/,
    errStr: "error.accounts.Invalid email",
  },

  {
    _id: "password",
    type: "password",
    placeholder: {
      default: "password",
      signUp: "custom.passwordPlaceholder",
    },
    required: true,
    minLength: 6,
    displayName: "password",
    re: /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/,
    errStr: "custom.passwordError",
  },
]);

const submitHookFunction = (error, state) => {
  // eslint-disable-line
  //  After submitting registration, resend, ...
  //  we want to go back to normal signin sub template
  Meteor.setTimeout(() => {
    AccountsTemplates.setState("signIn");
  }, 3000);
};

if (Meteor.isServer) {
  // #Security: Do not allow registering by anonymous visitors. Configurable via
  // settings.json
  AccountsTemplates.configure({
    forbidClientAccountCreation:
      GlobalSettings.forbidClientAccountCreation() ||
      LdapSettings.ldapHideStandardLogin(),
    sendVerificationEmail: GlobalSettings.sendVerificationEmail(),
    showResendVerificationEmailLink:
      GlobalSettings.showResendVerificationEmailLink(),
    showForgotPasswordLink: GlobalSettings.showForgotPasswordLink(),
    onSubmitHook: submitHookFunction,
  });

  // #Security: Do not allow standard/LDAP users log in under some conditions
  Accounts.validateLoginAttempt((attempt) => {
    if (attempt.user) {
      if (attempt.user.isInactive) {
        attempt.allowed = false;
        throw new Meteor.Error(403, "User account is inactive!");
      } else if (
        GlobalSettings.sendVerificationEmail() &&
        !attempt.user.emails[0].verified
      ) {
        attempt.allowed = false;
        throw new Meteor.Error(403, "User account is not verified!");
      } else if (
        LdapSettings.ldapHideStandardLogin() &&
        !attempt.user.isLDAPuser
      ) {
        attempt.allowed = false;
        throw new Meteor.Error(403, "Login only via LDAP!");
      }
    }
    return true;
  });
} else {
  // isClient
  AccountsTemplates.configure({
    forbidClientAccountCreation: Meteor.settings.public
      .forbidClientAccountCreation
      ? Meteor.settings.public.forbidClientAccountCreation
      : false,

    sendVerificationEmail:
      Meteor.settings.public.enableMailDelivery === true &&
      Meteor.settings.public.sendVerificationEmail
        ? Meteor.settings.public.sendVerificationEmail
        : false,

    showResendVerificationEmailLink:
      Meteor.settings.public.enableMailDelivery === true &&
      Meteor.settings.public.showResendVerificationEmailLink
        ? Meteor.settings.public.showResendVerificationEmailLink
        : false,

    showForgotPasswordLink:
      Meteor.settings.public.enableMailDelivery === true &&
      Meteor.settings.public.showForgotPasswordLink
        ? Meteor.settings.public.showForgotPasswordLink
        : false,

    onSubmitHook: submitHookFunction,
  });

  Accounts.onLogin(async () => {
    await I18nHelper.setLanguageLocale();
  });

  Accounts.onLogout(async function () {
    // reset to browser's locale after logout of user
    await I18nHelper.setLanguageLocale();
  });
}
