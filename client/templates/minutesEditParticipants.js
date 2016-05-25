import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'

let _minutesID; // the ID of these minutes

let isEditable = function () {
    let min = new Minutes(_minutesID);
    return min.isCurrentUserModerator() && !min.isFinalized;
};

Template.minutesEditParticipants.onCreated(function() {
    _minutesID = this.data._id;
    console.log("Template minutesEditParticipants created with minutesID "+_minutesID);
});

Template.minutesEditParticipants.onRendered(function() {
    $.material.init()
});



Template.minutesEditParticipants.helpers({
    userNameForId (userId) {
        return Meteor.users.findOne(userId).username;
    },

    isModeratorOfParentSeries (userId) {
        let aMin = new Minutes(_minutesID);
        let usrRole = new UserRoles(userId);

        return usrRole.isModeratorOf(aMin.parentMeetingSeriesID());
    },

    checkedStatePresent() {
        if (this.present) {
            return {checked: "checked"};
        }
        return {};
    },

    disableUIControl: function () {
        if (isEditable()) {
            return "";
        } else {
            return {disabled: "disabled"};
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
    }
});
