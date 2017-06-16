import { Template } from 'meteor/templating';
import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { MinutesFinder } from '../../../imports/services/minutesFinder';

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
        return MeetingSeries.find({}, {sort: {lastMinutesDate: -1}});
    }
});

Template.meetingSeriesOverview.helpers({
    isModeratorOfSeries: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(Template.instance().data._id);
    },

    lastMinutes() {
        const seriesDocumentFromDataContext = this;
        return MinutesFinder.lastMinutesOfMeetingSeries(seriesDocumentFromDataContext);
    }
});
