import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Markdown } from 'meteor/perak:markdown';

import { handleMigration } from './migrations/migrations';
import { GlobalSettings } from '/imports/config/GlobalSettings';
import { LdapSettings } from '/imports/config/LdapSettings';
import '/imports/gitversioninfo';
import '/imports/config/accounts';
import '/imports/config/EMailTemplates';

import '/imports/broadcastmessage';
import '/imports/minutes';
import '/imports/meetingseries';
import '/imports/collections/broadcastmessage_private';
import { BroadcastMessageSchema } from '/imports/collections/broadcastmessages.schema';
import '/imports/collections/users_private';
import '/imports/collections/userroles_private';
import '/imports/collections/onlineusers_private';
import '/server/ldap';
import '/server/sendResetPasswordMail';
import '/imports/statistics';
import '/imports/collections/attachments_private';
import '/imports/collections/documentgeneration_private';

import '/imports/services/finalize-minutes/finalizer';
import '/imports/services/isEditedService';

import cron from 'node-cron';
import importUsers from '/imports/ldap/import';

let handleDemoUserAccount = function () {
    if (GlobalSettings.createDemoAccount()) {
        let demoUser = Meteor.users.findOne({$and: [{username: 'demo'}, {isDemoUser: true}]});
        if (!demoUser) {    // we don't have a demo user, but settings demand one
            Accounts.createUser({username: 'demo', password: 'demo', email: '', profile: {name: 'Demo User'}});
            Meteor.users.update({'username': 'demo'}, {$set: {isDemoUser: true, isInactive: false, 'emails.0.verified': true}});
            console.log('*** ATTENTION ***\n    Created demo/demo user account once on startup');
        } else {    // we already have one, let's ensure he is not switched Inactive
            if (demoUser.isInactive) {
                Meteor.users.update({'username': 'demo'}, {$set: {isInactive: false}});
            }
            if (!demoUser.emails[0].verified) {
                Meteor.users.update({'username': 'demo'}, {$set: {'emails.0.verified': true}});
            }
        }
    } else {    // we don't want a demo user
        let demoUserActive = Meteor.users.findOne({$and: [{username: 'demo'}, {isDemoUser: true}, {isInactive: false}]});
        if (demoUserActive) {   // set demo account to Inactive
            Meteor.users.update({'username': 'demo'}, {$set: {isInactive: true}});
            console.log('*** ATTENTION ***\n    De-activated demo/demo user account (isInactive: true)');
        }
    }

    // #Security: warn admin if demo user exists
    let demoUserActive = Meteor.users.findOne({$and: [{username: 'demo'}, {isDemoUser: true}, {isInactive: false}]});
    if (demoUserActive) {
        console.log('*** ATTENTION ***\n' +
            '    There exists an account with user name \'demo\'.\n' +
            '    If this account was created with the setting \'branding.createDemoAccount\',\n' +
            '    the password for user \'demo\' is also \'demo\'.\n' +
            '    Please check, if this is wanted for your site\'s installation.\n');
    }
};


let syncRootUrl = function () {
    if (!Meteor.settings) {
        console.log('*** Warning: no settings specified. Running in \'WTF\' mode.');
        return;
    }

    if (!Meteor.settings.ROOT_URL) {
        console.log('*** Warning: No ROOT_URL specified in settings.json.');
        console.log('             Links in EMails and file download may not work.');
        console.log('             Grabbing ROOT_URL from env variable.');
    }

    // We sync the two sources of ROOT_URL with a preference on Meteor.settings from settings.json
    // process.env.ROOT_URL will be set to localhost:port by meteor if not specified by the user.
    // So, process.env.ROOT_URL should always contain a value
    if (Meteor.settings.ROOT_URL) {
        process.env.ROOT_URL = Meteor.settings.ROOT_URL;
        __meteor_runtime_config__.ROOT_URL = Meteor.settings.ROOT_URL; //eslint-disable-line
    } else {
        Meteor.settings.ROOT_URL = process.env.ROOT_URL;
    }
};

Meteor.startup(() => {
    syncRootUrl();
    console.log('*** ROOT_URL: '+Meteor.settings.ROOT_URL);

    GlobalSettings.publishSettings();
    LdapSettings.loadSettingsAndPerformSanityCheck();

    process.env.MAIL_URL = GlobalSettings.getSMTPMailUrl();
    console.log('WebApp current working directory:'+process.cwd());

    // #Security: Make sure that all server side markdown rendering quotes all HTML <TAGs>
    Markdown.setOptions({
        sanitize: true
    });

    handleMigration();
    //Migrations.migrateTo(12);     // Plz. keep this comment for manual testing... ;-)

    handleDemoUserAccount();

    // If we find no admin broadcast messages, we create an INactive one for
    // easy re-activating.
    if (BroadcastMessageSchema.find().count() === 0) {
        let message = 'Warning: 4Minitz will be down for maintenance in *4 Minutes*. ' +
            'Downtime will be about 4 Minutes. Just submit open dialogs. ' +
            'Then nothing is lost. You may finalize meetings later.';
        BroadcastMessageSchema.insert({
            text: message,
            isActive: false,
            createdAt: new Date(),
            dismissForUserIDs: []});
    }

    if (GlobalSettings.hasImportUsersCronTab() || GlobalSettings.getImportUsersOnLaunch()) {
        const crontab = GlobalSettings.getImportUsersCronTab(),
            mongoUrl = process.env.MONGO_URL,
            ldapSettings = GlobalSettings.getLDAPSettings();

        if (GlobalSettings.getImportUsersOnLaunch()) {
            console.log('Importing LDAP user on launch. Disable via setting importOnLaunch.');
            importUsers(ldapSettings, mongoUrl)
                .catch(() => {});
        }
        if (GlobalSettings.hasImportUsersCronTab()) {
            console.log('Configuring cron job for regular LDAP user import.');
            cron.schedule(crontab, function () {
                importUsers(ldapSettings, mongoUrl)
                    .catch(() => {});
            });
        }
    }
});

