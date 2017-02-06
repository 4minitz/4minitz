
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

let _filterUsers = new ReactiveVar();
_filterUsers.set("");

Template.admin.helpers({
    users(){
        let filterString = _filterUsers.get();
        let filterOptions = filterString.length > 0
            ? {$or: [{"username": {$regex: filterString, $options: "i"}},
                     {"profile.name": {$regex: filterString, $options: "i"}},
                     {"emails.0.address": {$regex: filterString, $options: "i"}},
                     {"_id": {$regex: filterString, $options: "i"}}]}
            : {};
        return Meteor.users.find(filterOptions, {sort: {username: 1}, limit: 50});
    },

    "inactiveStateText"(user) {
        if (user.isInactive) {
            return "Inactive";
        }
        return "Active";
    },
    "inactiveStateColor"(user) {
        if (user.isInactive) {
            return "#F9A2AE";
        }
        return "#A2F9EA";
    },

    "email"(user) {
        if (user.emails && user.emails.length > 0) {
            return user.emails[0].address;
        }
        return "";
    }
});

Template.admin.events({
    "keyup #id_adminFilterUsers"(evt, tmpl) {
        let filterString = tmpl.find("#id_adminFilterUsers").value;
        _filterUsers.set(filterString);
    },

    "click #id_ToggleInactive"(evt, tmpl) {
        evt.preventDefault();
        Meteor.call("users.admin.ToggleInactiveUser", this._id);
    }
});
