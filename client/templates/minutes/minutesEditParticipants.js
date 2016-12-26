import { FlowRouter } from 'meteor/kadira:flow-router';

import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'

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


Template.minutesEditParticipants.onCreated(function() {
    _minutesID = FlowRouter.getParam('_id');
    console.log("Template minutesEditParticipants created with minutesID "+_minutesID);

    // Calculate initial expanded/collapsed state
    Session.set("participants.expand", false);
    if (isEditable()) {
        Session.set("participants.expand", true);
    }
});

Template.minutesEditParticipants.helpers({
    userNameForId (userId) {
        return Meteor.users.findOne(userId).username;
    },

    isModeratorOfParentSeries (userId) {
        return isModeratorOfParentSeries(userId);
    },
    
    isParticipantsExpanded() {
        return Session.get("participants.expand");
    },
    
    collapsedParticipantsNames() {
        let aMin = new Minutes(_minutesID);
        return aMin.getPresentParticipantNames();        
    },

    checkedStatePresent() {
        if (this.present) {
            return {checked: "checked"};
        }
        return {};
    },

    disableUIControl() {
        if (isEditable()) {
            return "";
        } else {
            return {disabled: "disabled"};
        }
    },

    // some responsive CSS tweaking
    useClassWell() {
        if (! Session.get("global.isMobileWidth")) {
            return "well";
        }
    },

    useStylePadding() {
        if (! Session.get("global.isMobileWidth")) {
            return "padding-left: 1.5em;";
        }
    }
});


Template.minutesEditParticipants.events({
    "click #btnTogglePresent" (evt, tmpl) {
        let min = new Minutes(_minutesID);
        let indexInParticipantsArray = evt.target.dataset.index;
        let checkedState = evt.target.checked;
        min.updateParticipantPresent(indexInParticipantsArray, checkedState);
    },
    "change #edtParticipantsAdditional" (evt, tmpl) {
        console.log("Trigger!");
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            console.log("   Min!");
            let theParticipant = tmpl.find("#edtParticipantsAdditional").value;
            aMin.update({participantsAdditional: theParticipant});
        }
    },

    "click #btnParticipantsCollapse" () {
        Session.set("participants.expand", !Session.get("participants.expand"));
    }
});
