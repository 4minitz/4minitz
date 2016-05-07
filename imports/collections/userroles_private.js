
import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
    Meteor.publish('userListSimple', function () {
        return Meteor.users.find(
            {},
            // intentionally suppress email addresses of all other users!
            {fields: {'username': 1, 'roles': 1}});
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('userListSimple');
}
