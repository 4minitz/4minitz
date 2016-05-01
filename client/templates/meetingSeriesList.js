import { MeetingSeries } from '/imports/meetingseries'


Template.meetingSeriesList.onCreated(function () {
});


Template.meetingSeriesList.onRendered(function () {
    $.material.init();
});


Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
      return MeetingSeries.find({}, {sort: {lastMinutesDate: -1}});
    }
});

Template.meetingSeriesOverview.helpers({
    addMinutesPath: function () {
        let ms = new MeetingSeries(this._id);
        return (ms.addNewMinutesAllowed()) ? "/minutesadd/" + this._id : "";
    },

    addMinutesNotAllowed: function () {
        let ms = new MeetingSeries(this._id);
        return !ms.addNewMinutesAllowed();
    }
});

Template.meetingSeriesList.events({
    "click .hidehelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
