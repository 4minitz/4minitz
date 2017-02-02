import { Meteor } from 'meteor/meteor';
import { User } from '/imports/users';

if (Meteor.isServer) {
    let isAdmin = function (id) {
        if (Meteor.settings.adminIDs &&
            Array.isArray(Meteor.settings.adminIDs) &&
            Meteor.settings.adminIDs.length > 0 &&
            Meteor.settings.adminIDs.indexOf(id) > -1) {
            return true;
        }
        return false;
    };

    Meteor.methods({
        // #Security: we make this method server only and we answer the
        // "isAdmin" question only for he currently logged in user!
        // So, this method intentionally has no input parameter.
        'users.isCurrentUserAdmin'() {
            const id = Meteor.userId();
            return isAdmin(id);
        },

        'users.registerUser'(username, longname, email, password) {
            const id = Meteor.userId();
            if (! isAdmin(id)) {
                return;
            }

            Accounts.createUser({username: username,
                password: password,
                email: email,
                profile: {name: longname}});
        }

    });
}


Meteor.methods({
    'users.saveSettings'(settings) {
        const user = new User();
        console.log(user);

        const id = Meteor.userId();
        Meteor.users.update(id, { $set: {settings} });
        console.log(`saved settings for user ${id}: ${settings}`);
        console.log(settings);
        console.log(user);
    },

});