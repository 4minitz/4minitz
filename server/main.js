import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';
import { GlobalSettings } from '/imports/GlobalSettings';

import '/imports/minutes';
import '/imports/meetingseries';
import '/imports/collections/userroles_private'

Meteor.startup(() => {
    process.env.MAIL_URL = GlobalSettings.getSMTPMailUrl();

    handleMigration();
    // Migrations.migrateTo(1);     // Plz. keep this comment for manual testing... ;-)
});

