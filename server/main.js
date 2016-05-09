import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';

import '/imports/minutes';
import '/imports/meetingseries';

Meteor.startup(() => {
    handleMigration();
});