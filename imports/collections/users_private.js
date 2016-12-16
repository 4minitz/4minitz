import { Meteor } from 'meteor/meteor';
import { User } from '/imports/users';

Meteor.methods({
    'users.saveSettings'(settings) {
        const user = new User();
        console.log(user);

        const id = Meteor.userId();
        Meteor.users.update(id, { $set: {settings} });
        console.log(`saved settings for user ${id}: ${settings}`);
        console.log(settings);
        console.log(user);
    }
});