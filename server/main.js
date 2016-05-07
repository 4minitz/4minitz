import { Meteor } from 'meteor/meteor';
import { handleMigration } from './migrations';

Meteor.startup(() => {
    handleMigration();
});