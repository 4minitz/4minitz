import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';

import '/imports/minutes';
import '/imports/meetingseries';
import '/imports/collections/userroles_private'

Meteor.startup(() => {
    handleMigration();
});
