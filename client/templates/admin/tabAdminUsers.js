import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { OnlineUsersSchema } from '/imports/collections/onlineusers.schema';

let _filterUsers = new ReactiveVar('');
let _showInactive = new ReactiveVar(false);
let _showOnline = new ReactiveVar(false);
let _visibleCount = new ReactiveVar(0);

Template.tabAdminUsers.onCreated(function () {
    this.autorun(() => {
        this.subscribe('onlineUsersForRoute');
    });
});

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
        if (_showOnline.get()) {
            let onlineusers = OnlineUsersSchema.find().fetch().map(ousr => {return ousr.userId});
            filterOptions = {$and: [{'_id': {$in: onlineusers}}, filterOptions]};
        }

        let userCursor = Meteor.users.find(filterOptions, {sort: {username: 1}, limit: 250});
        _visibleCount.set(userCursor.count());
        return userCursor;
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
    },

    'userCountAll'() {
        if (_showInactive.get()) {
            return Meteor.users.find({}).count();
        }
        return Meteor.users.find({isInactive: {$not: true}}).count();
    },

    'userCountVisible'() {
        return _visibleCount.get()+0;
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
    },

    'change #id_adminShowOnline'(evt, tmpl) {
        _showOnline.set(tmpl.find('#id_adminShowOnline').checked);
    }

});
