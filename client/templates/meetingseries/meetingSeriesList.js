import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
        return MeetingSeries.find({}, {sort: {lastMinutesDate: -1}});
    }
});

Template.meetingSeriesOverview.helpers({
    isModeratorOfSeries: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(Template.instance().data._id);
    }
});
