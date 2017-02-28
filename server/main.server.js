import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';
import { GlobalSettings } from '/imports/GlobalSettings';

import '/imports/broadcastmessage'
import '/imports/minutes';
import '/imports/meetingseries';
import {BroadcastMessageCollection} from '/imports/collections/broadcastmessage_private';
import '/imports/collections/users_private';
import '/imports/collections/userroles_private';
import '/server/ldap';
import '/imports/statistics';
import '/imports/collections/attachments_private';

import cron from 'node-cron';
import importUsers from '/imports/ldap/import';


Meteor.startup(() => {
    GlobalSettings.publishSettings();
    process.env.MAIL_URL = GlobalSettings.getSMTPMailUrl();
    console.log("WebApp current working directory:"+process.cwd());
});


Meteor.startup(() => {
    // #Security: Make sure that all server side markdown rendering quotes all HTML <TAGs>
    Markdown.setOptions({
        sanitize: true
    });

    handleMigration();
    // Migrations.migrateTo(1);     // Plz. keep this comment for manual testing... ;-)

    if (GlobalSettings.createDemoAccount()) {
        let demoUser = Meteor.users.findOne({"username": "demo"});
        if (!demoUser) {
            Accounts.createUser({username: "demo", password: "demo", email: ""});
            console.log("*** ATTENTION ***\n    Created demo/demo user account once on startup");
        }
    }

    // #Security: warn admin if demo user exists
    let demoUser = Meteor.users.findOne({"username": "demo"});
    if (demoUser) {
        console.log("*** ATTENTION ***\n" +
            "    There exists an account with user name 'demo'.\n" +
            "    If this account was created with the setting 'branding.createDemoAccount',\n" +
            "    the password for user 'demo' is also 'demo'.\n" +
            "    Please check, if this is wanted for your site's installation.\n");
    }

    // If we find no admin broadcast messages, we create an INactive one for
    // easy re-activating.
    if (BroadcastMessageCollection.find().count() === 0) {
        message = "Warning: 4Minitz will be down for maintenance in *4 Minutes*. " +
            "Downtime will be about 4 Minutes. Just submit open dialogs. " +
            "Then nothing is lost. You may finalize meetings later.";
        BroadcastMessageCollection.insert({
            text: message,
            isActive: false,
            createdAt: new Date(),
            dismissForUserIDs: []});
    }

    if (GlobalSettings.hasImportUsersCronTab()) {
        const crontab = GlobalSettings.getImportUsersCronTab(),
            mongoUrl = process.env.MONGO_URL,
            ldapSettings = GlobalSettings.getLDAPSettings();

        console.log('Configuring cron job');
        cron.schedule(crontab, function () {
            importUsers(ldapSettings, mongoUrl);
        });
    }
});

