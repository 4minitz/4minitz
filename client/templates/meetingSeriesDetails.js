
import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'

var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated = function () {
    _meetingSeriesID = this.data;
};

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
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
