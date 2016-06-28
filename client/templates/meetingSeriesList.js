import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'


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
    },

    isModeratorOfSeries: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(this._id);
    }

});

Template.meetingSeriesList.events({
    "click .hidehelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    }
});
