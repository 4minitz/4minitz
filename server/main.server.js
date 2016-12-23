import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';
import { GlobalSettings } from '/imports/GlobalSettings';

import '/imports/minutes';
import '/imports/meetingseries';
import '/imports/collections/users_private';
import '/imports/collections/userroles_private';
import '/server/ldap';
import '/imports/collections/statistics_private';
import '/imports/collections/attachments_private'

Meteor.startup(() => {
    GlobalSettings.publishSettings();
    process.env.MAIL_URL = GlobalSettings.getSMTPMailUrl();
    console.log("WebApp current working directory:"+process.cwd());
});


Meteor.startup(() => {
    // Make sure that all server side markdown rendering quotes all HTML <TAGs>
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

    // Security: warn admin if demo user exists
    let demoUser = Meteor.users.findOne({"username": "demo"});
    if (demoUser) {
        console.log("*** ATTENTION ***\n" +
            "    There exists an account with user name 'demo'.\n" +
            "    If this account was created with the setting 'branding.createDemoAccount',\n" +
            "    the password for user 'demo' is also 'demo'.\n" +
            "    Please check, if this is wanted for your site's installation.\n");
    }
});
