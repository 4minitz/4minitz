import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'

Template.meetingSeriesList.onRendered(function () {
});


Template.meetingSeriesList.onCreated(function () {
});

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
      return MeetingSeries.find({}, {sort: {createdAt: -1}});
    }
});

Template.meetingSeriesList.events({
    "click .hidehelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "click #deleteMeetingSeries": function() {
        console.log("Remove Meeting Series"+this._id);
        if (confirm("Do you really want to delete this meeting series?")) {
            MeetingSeries.remove(this._id);
        }
    }
});
