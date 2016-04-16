
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
        var minIDs = ms.minutes;        // TODO realize MeetingSeries => Minutes via method
        var results = [];
        for (let index = 0; index < minIDs.length; ++index) {
            var id = minIDs[index];
            var min = Minutes.findOne(id);
            results.push (min);
        }
        return results;
    }
});

Template.meetingSeries.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
