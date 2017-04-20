import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Markdown } from 'meteor/perak:markdown';

import { handleMigration } from './migrations/migrations';
import { GlobalSettings } from '/imports/GlobalSettings';

import '/imports/broadcastmessage';
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

handleDemoUserAccount = function () {
    if (GlobalSettings.createDemoAccount()) {
        let demoUser = Meteor.users.findOne({$and: [{username: "demo"}, {isDemoUser: true}]});
        if (!demoUser) {    // we don't have a demo user, but settings demand one
            Accounts.createUser({username: "demo", password: "demo", email: "", profile: {name: "Demo User"}});
            Meteor.users.update({"username": "demo"}, {$set: {isDemoUser: true, isInactive: false}});
            console.log("*** ATTENTION ***\n    Created demo/demo user account once on startup");
        } else {    // we already have one, let's ensure he is not switched Inactive
            if (demoUser.isInactive) {
                Meteor.users.update({"username": "demo"}, {$set: {isInactive: false}});
            }
        }
    } else {    // we don't want a demo user
        let demoUserActive = Meteor.users.findOne({$and: [{username: "demo"}, {isDemoUser: true}, {isInactive: false}]});
        if (demoUserActive) {   // set demo account to Inactive
            Meteor.users.update({"username": "demo"}, {$set: {isInactive: true}});
            console.log("*** ATTENTION ***\n    De-activated demo/demo user account (isInactive: true)");
        }
    }

    // #Security: warn admin if demo user exists
    let demoUserActive = Meteor.users.findOne({$and: [{username: "demo"}, {isDemoUser: true}, {isInactive: false}]});
    if (demoUserActive) {
        console.log("*** ATTENTION ***\n" +
            "    There exists an account with user name 'demo'.\n" +
            "    If this account was created with the setting 'branding.createDemoAccount',\n" +
            "    the password for user 'demo' is also 'demo'.\n" +
            "    Please check, if this is wanted for your site's installation.\n");
    }
};



Meteor.startup(() => {
    GlobalSettings.publishSettings();
    process.env.MAIL_URL = GlobalSettings.getSMTPMailUrl();
    console.log("WebApp current working directory:"+process.cwd());

    // #Security: Make sure that all server side markdown rendering quotes all HTML <TAGs>
    Markdown.setOptions({
        sanitize: true
    });

    handleMigration();
    // Migrations.migrateTo(11);     // Plz. keep this comment for manual testing... ;-)

    handleDemoUserAccount();

    // If we find no admin broadcast messages, we create an INactive one for
    // easy re-activating.
    if (BroadcastMessageCollection.find().count() === 0) {
        let message = "Warning: 4Minitz will be down for maintenance in *4 Minutes*. " +
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

        console.log('Configuring cron job for regular LDAP user import.');
        cron.schedule(crontab, function () {
            importUsers(ldapSettings, mongoUrl);
        });
    }
});

