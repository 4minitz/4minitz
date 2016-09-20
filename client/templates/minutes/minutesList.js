import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'

Template.minutesList.helpers({
    buttonBackground: function () {
        return (this.isFinalized) ? "default" : "info";
    },

    addMinutesPath: function () {
        let ms = new MeetingSeries(this.meetingSeriesId);
        return (ms.addNewMinutesAllowed()) ? "/minutesadd/" + this.meetingSeriesId : "";
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
        console.log("User: "+Meteor.user()+" is leaving Meeting Series" + this.meetingSeries_id);

        let dialogContent = "<p>Do you really want to leave this meeting series?</p>";
        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
            },
            dialogContent,
            "Leave Meeting Series",
            "Leave",
            "btn-warning"
        );

    }
});