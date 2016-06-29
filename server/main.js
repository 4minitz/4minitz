import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';
import { GlobalSettings } from '/imports/GlobalSettings';

import '/imports/minutes';
import '/imports/meetingseries';
import '/imports/collections/userroles_private'

import { ServerTemplate } from 'meteor/felixble:server-templates'

Meteor.startup(() => {
    GlobalSettings.publishSettings();
    process.env.MAIL_URL = GlobalSettings.getSMTPMailUrl();

    handleMigration();
    // Migrations.migrateTo(1);     // Plz. keep this comment for manual testing... ;-)

    console.log(ServerTemplate.render("Hallo {{name}}", {name: "felix"}));
});

