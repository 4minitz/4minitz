import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Minutes } from '/imports/minutes';
import { UserRoles } from '/imports/userroles';
import { ReactiveVar } from 'meteor/reactive-var';
import { handleError } from '/client/helpers/handleError';
import { OnlineUsersSchema } from '/imports/collections/onlineusers.schema';
import '/imports/collections/onlineusers_private';

let _minutesID; // the ID of these minutes

let isEditable = function () {
    let min = new Minutes(_minutesID);
    return min.isCurrentUserModerator() && !min.isFinalized;
};

let isModeratorOfParentSeries = function (userId) {
    let aMin = new Minutes(_minutesID);
    let usrRole = new UserRoles(userId);
    return usrRole.isModeratorOf(aMin.parentMeetingSeriesID());
};

let userNameForId = function (userId) {
    let usr = Meteor.users.findOne(userId);
    if (usr) {
        let showName = usr.username;
        // If we have a long name for the user: prepend it!
        if (usr.profile && usr.profile.name && usr.profile.name !== '') {
            showName = usr.profile.name + ' ('+showName+')';
        }
        return showName;

    } else {
        return 'Unknown User ('+userId+')';
    }
};

function allParticipantsMarked() {
    let aMin = new Minutes(_minutesID);
    return (aMin.participants.findIndex(p => {return !p.present;}) === -1);
}

Template.minutesEditParticipants.onCreated(function() {
    _minutesID = FlowRouter.getParam('_id');
    console.log('Template minutesEditParticipants created with minutesID '+_minutesID);

    this.autorun(() => {
        this.subscribe('onlineUsersForRoute', FlowRouter.current().path);
    });

    // Calculate initial expanded/collapsed state
    Session.set('participants.expand', false);
    if (isEditable()) {
        Session.set('participants.expand', true);
    }
    this.markedAll = new ReactiveVar(allParticipantsMarked());
});

Template.minutesEditParticipants.helpers({
    getUserDisplayName (userId) {
        return userNameForId(userId);
    },

    isUserRemotelyConnected (userId) {
        return !!OnlineUsersSchema.findOne({ userId: userId, activeRoute: FlowRouter.current().path });
    },

    isModeratorOfParentSeries (userId) {
        return isModeratorOfParentSeries(userId);
    },
    
    isParticipantsExpanded() {
        return Session.get('participants.expand');
    },
    
    collapsedParticipantsNames() {
        let aMin = new Minutes(_minutesID);
        return aMin.getPresentParticipantNames();        
    },

    checkedStatePresent() {
        if (this.present) {
            return {checked: 'checked'};
        }
        return {};
    },

    disableUIControl() {
        if (isEditable()) {
            return '';
        } else {
            return {disabled: 'disabled'};
        }
    },

    hasInformedUsers() {
        let aMin = new Minutes(_minutesID);
        return (aMin.informedUsers && aMin.informedUsers.length > 0);
    },

    getInformedUsers() {
        let aMin = new Minutes(_minutesID);
        let informedNames = '';
        if (aMin.informedUsers && aMin.informedUsers.length > 0) {
            aMin.informedUsers.forEach(id => {
                informedNames = informedNames + userNameForId(id) + ', ';
            });
            informedNames = informedNames.slice(0, -2); // remove last ", "
        }
        return informedNames;
    },

    switch2MultiColumn() {
        let aMin = new Minutes(_minutesID);

        if (aMin.participants.length > 7) {
            return 'multicolumn';
        }
    },

    enoughParticipants(){
        let aMin = new Minutes(_minutesID);
        return (aMin.participants.length > 2);
    },

    isChecked(){
        return Template.instance().markedAll.get();
    },

    isEditable() {
        return isEditable();
    },

    parentMeetingSeries() {
        let aMin = new Minutes(_minutesID);
        return aMin.parentMeetingSeries();
    }
});


Template.minutesEditParticipants.events({
    'click #btnTogglePresent' (evt, tmpl) {
        let min = new Minutes(_minutesID);
        let indexInParticipantsArray = evt.target.dataset.index;
        let checkedState = evt.target.checked;
        min.updateParticipantPresent(indexInParticipantsArray, checkedState);
        tmpl.markedAll.set(allParticipantsMarked());
    },
    'change #edtParticipantsAdditional' (evt, tmpl) {
        console.log('Trigger!');
        let aMin = new Minutes(_minutesID);
        console.log('   Min!');
        let theParticipant = tmpl.find('#edtParticipantsAdditional').value;
        aMin.update({participantsAdditional: theParticipant});
    },

    'click #btnParticipantsExpand' () {
        Session.set('participants.expand', !Session.get('participants.expand'));
    },

    'click #btnToggleMarkAllNone' (evt, tmpl){
        let aMin = new Minutes(_minutesID);
        if (allParticipantsMarked()) {
            aMin.changeParticipantsStatus(false).catch(handleError);
            tmpl.markedAll.set(false);
        }
        else {
            aMin.changeParticipantsStatus(true).catch(handleError);
            tmpl.markedAll.set(true);
        }
    },

    'click #btnEditParticipants' () {
        Session.set('meetingSeriesEdit.showUsersPanel', true);
    }
});
