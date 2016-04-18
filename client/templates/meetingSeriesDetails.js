
import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'

var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    _meetingSeriesID = this.data;
});

Template.meetingSeriesDetails.helpers({
    meetingSeries: function() {
        return new MeetingSeries(_meetingSeriesID);
    },

    minutes: function() {
        let ms = new MeetingSeries(_meetingSeriesID);
        return ms.getAllMinutes();
    }
});

Template.meetingSeriesDetails.events({
    "click #deleteMinutes": function () {
        console.log("Remove Meeting Minute " + this._id);
        if (confirm("Do you really want to delete this meeting minute?")) {
            // TODO: delete minutes
            Minutes.remove(this._id);
        }
    },
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
