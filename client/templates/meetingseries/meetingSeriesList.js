import { Template } from 'meteor/templating';
import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { MinutesFinder } from '../../../imports/services/minutesFinder';
import { Session } from 'meteor/session';

Template.meetingSeriesList.onCreated(function () {
    this.autorun(() => {
        this.subscribe('meetingSeriesOverview');
    });
});

Template.meetingSeriesList.helpers({
    meetingSeriesRow: function () {
        if ((Session.get('search-query') === '') || (Session.get('search-query') === undefined)) {
            return MeetingSeries.find({}, {sort: {lastMinutesDate: -1}});
        }else{
            if(Template.meetingSeriesSearch.searchResults().count()>0){
                return Template.meetingSeriesSearch.searchResults();
            }else{
                return false;
            }
        }
    },
    meetingSeriesAmountBiggerFour: function () {
        return MeetingSeries.find().count() > 4;
    },
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
