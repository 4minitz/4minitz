import { MeetingSeries } from '/imports/meetingseries'

Template.meetingSeriesList.onRendered(function () {
});


Template.meetingSeriesList.onCreated(function () {
});

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
      return MeetingSeries.find({}, {sort: {lastChange: -1}});
    }
});

Template.meetingSeriesList.events({
    "click .hidehelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "click #deleteMeetingSeries": function() {
        console.log("Remove Meeting Series"+this._id);
        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                MeetingSeries.remove(this._id);
            },
            /* Dialog content */
            "Do you really want to delete this meeting series?"
        );
    }
});
