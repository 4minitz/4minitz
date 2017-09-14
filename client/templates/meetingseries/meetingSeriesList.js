import { Template } from 'meteor/templating';
import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { MinutesFinder } from '../../../imports/services/minutesFinder';

Template.meetingSeriesList.onCreated(function () {
    this.searchQuery = new ReactiveVar('');
});

function getFilteredSeries(queryString) {
    const split = queryString.match(/[^\s]+/g) || [],
        query = new RegExp(split.join('|'), 'i');

    return MeetingSeries.find({ $or: [{ 'name': query }, { 'project': query }] });
}

Template.meetingSeriesList.helpers({
    meetingSeriesRow() {
        const searchQuery = Template.instance().searchQuery.get();

        if (searchQuery === '') {
            return MeetingSeries.find({}, { sort: { lastMinutesDate: -1 } });
        } else {
            const results = getFilteredSeries(searchQuery);
            if (results.count() > 0) {
                return results;
            } else {
                return false;
            }
        }
    },

    meetingSeriesAmountBiggerFour() {
        return MeetingSeries.find().count() > 4;
    },

    updateSearchQuery() {
        const tpl = Template.instance();

        return (query) => {
            tpl.searchQuery.set(query);
        };
    }
});

Template.meetingSeriesOverview.helpers({
    isModeratorOfSeries() {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(Template.instance().data._id);
    },

    lastMinutes() {
        const seriesDocumentFromDataContext = this;
        return MinutesFinder.lastMinutesOfMeetingSeries(seriesDocumentFromDataContext);
    }
});
