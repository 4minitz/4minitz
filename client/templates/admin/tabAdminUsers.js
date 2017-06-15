import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

let _filterUsers = new ReactiveVar('');
let _showInactive = new ReactiveVar(false);

Template.tabAdminUsers.onRendered(function() {
    _filterUsers.set('');
    Template.instance().find('#id_adminFilterUsers').focus();
    Template.instance().find('#id_adminShowInactive').checked = _showInactive.get();
});

Template.tabAdminUsers.helpers({
    users(){
        let filterString = _filterUsers.get();
        let filterOptions = filterString.length > 0
            ? {$or: [{'username': {$regex: filterString, $options: 'i'}},
                     {'profile.name': {$regex: filterString, $options: 'i'}},
                     {'emails.0.address': {$regex: filterString, $options: 'i'}},
                     {'_id': {$regex: filterString, $options: 'i'}}]}
            : {};
        if (! _showInactive.get()) {
            filterOptions = {$and: [{isInactive: {$not: true}}, filterOptions]};
        }
        return Meteor.users.find(filterOptions, {sort: {username: 1}, limit: 250});
    },

    'inactiveStateText'(user) {
        if (user.isInactive) {
            return 'Inactive';
        }
        return 'Active';
    },
    'inactiveStateColor'(user) {
        if (user.isInactive) {
            return '#ffced9';
        }
        return '#A2F9EA';
    },

    'email'(user) {
        if (user.emails && user.emails.length > 0) {
            return user.emails[0].address;
        }
        return '';
    }
});

Template.tabAdminUsers.events({
    'keyup #id_adminFilterUsers'(evt, tmpl) {
        let filterString = tmpl.find('#id_adminFilterUsers').value;
        _filterUsers.set(filterString);
    },

    'click #id_ToggleInactive'(evt) {
        evt.preventDefault();
        Meteor.call('users.admin.ToggleInactiveUser', this._id);
    },

    'change #id_adminShowInactive'(evt, tmpl) {
        _showInactive.set(tmpl.find('#id_adminShowInactive').checked);
    }
});
