import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'

Template.minutesList.helpers({
    buttonBackground: function () {
        return (this.isFinalized) ? "default" : "info";
    },

    meetingSeriesId: function () {
        return this.meetingSeriesId;
    },

    addMinutesNotAllowed: function () {
        let ms = new MeetingSeries(this.meetingSeriesId);
        return !ms.addNewMinutesAllowed();
    },

    isDeleteAllowed: function () {
        return (!this.isFinalized);
    },

    isModeratorOfParentSeries: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(this.meetingSeriesId);
    }
});

Template.minutesList.events({
    "click #btnLeaveMeetingSeries": function () {
        let ms = new MeetingSeries(this.meetingSeriesId);

        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                console.log("User: "+Meteor.user().username+" is leaving Meeting Series: " + this.meetingSeriesId);
                MeetingSeries.leave(ms);
                FlowRouter.go("/");
            },
            "<p>Do you really want to leave the meeting series:<br>" +
            "&nbsp;&nbsp;&nbsp;&nbsp;<b>" + ms.project + " / " + ms.name + "</b><br>" +
            "You will have to ask a moderator if you want to join again afterwards.</p>",
            "Leave Meeting Series",
            "Leave",
            "btn-danger"
        );

    }
});