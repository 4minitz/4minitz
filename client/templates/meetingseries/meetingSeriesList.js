import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { User, userSettings } from '/imports/users';

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
    isModeratorOfSeries: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(Template.instance().data._id);
    }
});

Template.meetingSeriesList.events({
    'click .hidehelp': function () {
        const user = new User();
        user.storeSetting(userSettings.showQuickHelp.meetingSeriesList, false);
    }
});
