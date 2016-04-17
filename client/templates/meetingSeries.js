
import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'

var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeries.created = function () {
    _meetingSeriesID = this.data;
};

Template.meetingSeries.helpers({
    meetingSeries: function() {
        return new MeetingSeries(_meetingSeriesID);
    },

    minutes: function() {
        let ms = new MeetingSeries(_meetingSeriesID);
        return ms.getAllMinutes();
    }
});

Template.meetingSeries.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
