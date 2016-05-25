import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';

import '/imports/minutes';
import '/imports/meetingseries';
import '/imports/collections/userroles_private'

Meteor.startup(() => {
    handleMigration();
    // Migrations.migrateTo(1);     // Plz. keep this comment for manual testing... ;-)
});

