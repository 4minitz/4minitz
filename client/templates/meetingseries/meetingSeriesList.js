import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'
import { User, userSettings } from '/imports/users'

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
      return MeetingSeries.find({}, {sort: {lastMinutesDate: -1}});
    },

    showQuickHelp: function() {
        const user = new User();
        return user.getSetting(userSettings.showQuickHelp.meetingSeriesList, true);
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
        const user = new User();
        user.storeSetting(userSettings.showQuickHelp.meetingSeriesList, false);
    }
});
