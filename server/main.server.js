import "/imports/gitversioninfo";
import "/imports/config/accounts";
import "/imports/config/EMailTemplates";
import "/imports/broadcastmessage";
import "/imports/minutes";
import "/imports/meetingseries";
import "/imports/collections/broadcastmessage_private";
import "/imports/collections/users_private";
import "/imports/collections/userroles_private";
import "/imports/collections/onlineusers_private";
import "/server/ldap";
import "/server/sendResetPasswordMail";
import "/imports/statistics";
import "/imports/collections/attachments_private";
import "/imports/collections/documentgeneration_private";
import "/imports/services/finalize-minutes/finalizer";
import "/imports/services/isEditedService";
import "/imports/helpers/i18n";

import { BroadcastMessageSchema } from "/imports/collections/broadcastmessages.schema";
import { GlobalSettings } from "/imports/config/GlobalSettings";
import { LdapSettings } from "/imports/config/LdapSettings";
import importUsers from "/imports/ldap/import";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { Markdown } from "meteor/perak:markdown";
import { i18n } from "meteor/universe:i18n";
import cron from "node-cron";

import { handleMigration } from "./migrations/migrations";

i18n.setLocale("en");

const handleDemoUserAccount = () => {
  if (GlobalSettings.createDemoAccount()) {
    const demoUser = Meteor.users.findOne({
      $and: [{ username: "demo" }, { isDemoUser: true }],
    });
    if (demoUser) {
      // we already have one, let's ensure he is not switched Inactive
      if (demoUser.isInactive) {
        Meteor.users.update(
          { username: "demo" },
          { $set: { isInactive: false } },
        );
      }
      if (!demoUser.emails[0].verified) {
        Meteor.users.update(
          { username: "demo" },
          { $set: { "emails.0.verified": true } },
        );
      }
    } else {
      // we don't have a demo user, but settings demand one
      Accounts.createUser({
        username: "demo",
        password: "demo",
        email: "",
        profile: { name: "Demo User" },
      });
      Meteor.users.update(
        { username: "demo" },
        {
          $set: {
            isDemoUser: true,
            isInactive: false,
            "emails.0.verified": true,
          },
        },
      );
      console.log(
        "*** ATTENTION ***\n    Created demo/demo user account once on startup",
      );
    }
  } else {
    // we don't want a demo user
    const demoUserActive = Meteor.users.findOne({
      $and: [{ username: "demo" }, { isDemoUser: true }, { isInactive: false }],
    });
    if (demoUserActive) {
      // set demo account to Inactive
      Meteor.users.update({ username: "demo" }, { $set: { isInactive: true } });
      console.log(
        "*** ATTENTION ***\n    De-activated demo/demo user account (isInactive: true)",
      );
    }
  }

  // #Security: warn admin if demo user exists
  const demoUserActive = Meteor.users.findOne({
    $and: [{ username: "demo" }, { isDemoUser: true }, { isInactive: false }],
  });
  if (demoUserActive) {
    console.log(
      "*** ATTENTION ***\n" +
        "    There exists an account with user name 'demo'.\n" +
        "    If this account was created with the setting 'branding.createDemoAccount',\n" +
        "    the password for user 'demo' is also 'demo'.\n" +
        "    Please check, if this is wanted for your site's installation.\n",
    );
  }
};

const syncRootUrl = () => {
  if (!Meteor.settings) {
    console.log("*** Warning: no settings specified. Running in 'WTF' mode.");
    return;
  }

  if (!Meteor.settings.ROOT_URL) {
    console.log("*** Warning: No ROOT_URL specified in settings.json.");
    console.log("             Links in EMails and file download may not work.");
    console.log("             Grabbing ROOT_URL from env variable.");
  }

  // We sync the two sources of ROOT_URL with a preference on Meteor.settings
  // from settings.json process.env.ROOT_URL will be set to localhost:port by
  // meteor if not specified by the user. So, process.env.ROOT_URL should always
  // contain a value
  if (Meteor.settings.ROOT_URL) {
    process.env.ROOT_URL = Meteor.settings.ROOT_URL;
    __meteor_runtime_config__.ROOT_URL = Meteor.settings.ROOT_URL; // eslint-disable-line
    // We overwrite the `rootUrl` also in the `defaultOptions` which might be
    // overwritten by any other package ?! see
    // https://github.com/meteor/meteor/blob/24865b28a0689de8b4949fb69ea1f95da647cd7a/packages/meteor/url_common.js#L52
    // and https://github.com/4minitz/4minitz/issues/504
    Meteor.absoluteUrl.defaultOptions.rootUrl = Meteor.settings.ROOT_URL;
    return;
  }
  Meteor.settings.ROOT_URL = process.env.ROOT_URL;
};

Meteor.startup(() => {
  syncRootUrl();
  console.log(`*** ROOT_URL: ${Meteor.settings.ROOT_URL}`);

  GlobalSettings.publishSettings();
  LdapSettings.loadSettingsAndPerformSanityCheck();

  process.env.MAIL_URL = GlobalSettings.getSMTPMailUrl();
  console.log(`WebApp current working directory:${process.cwd()}`);

  // #Security: Make sure that all server side markdown rendering quotes all
  // HTML <TAGs>
  Markdown.setOptions({
    sanitize: true,
  });

  handleMigration();
  // Migrations.migrateTo(12);     // Plz. keep this comment for manual
  // testing... ;-)

  handleDemoUserAccount();

  // If we find no admin broadcast messages, we create an INactive one for
  // easy re-activating.
  if (BroadcastMessageSchema.find().count() === 0) {
    // #I18N: No translation here. We don't have a logged in user, so we can't
    // know the desired language But admin may do so in Admin frontend where
    // messages can be overwritten.
    const message =
      "Warning: 4Minitz will be down for maintenance in *4 Minutes*. " +
      "Downtime will be about 4 Minutes. Just submit open dialogs. " +
      "Then nothing is lost. You may finalize meetings later.";
    BroadcastMessageSchema.insert({
      text: message,
      isActive: false,
      createdAt: new Date(),
      dismissForUserIDs: [],
    });
  }

  if (
    !(GlobalSettings.hasImportUsersCronTab() ||
  GlobalSettings.getImportUsersOnLaunch())
  ) {
    return;
  }
  const crontab = GlobalSettings.getImportUsersCronTab();
  const mongoUrl = process.env.MONGO_URL;
  const ldapSettings = GlobalSettings.getLDAPSettings();
  console.log("MONGO_URL:", mongoUrl);

  if (GlobalSettings.getImportUsersOnLaunch()) {
    console.log(
      "Importing LDAP users on launch. Disable via settings.json ldap.importOnLaunch.",
    );
    importUsers(ldapSettings, mongoUrl).catch(() => {});
  }
  if (GlobalSettings.hasImportUsersCronTab()) {
    console.log("Configuring cron job for regular LDAP user import.");
    cron.schedule(crontab, () => {
      importUsers(ldapSettings, mongoUrl).catch(() => {});
    });
  }
});
