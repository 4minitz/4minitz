import { Template } from 'meteor/templating';
import { MeetingSeries } from '/imports/meetingseries';
import { ReactiveVar } from 'meteor/reactive-var';

function getFilteredSeries(queryString) {
    const split = queryString.trim().match(/[^\s]+/g) || [],
        queries = split.map(singleQuery => {
            const regex = new RegExp(singleQuery, 'i');
            return {
                $or: [{name: regex}, {project: regex}]
            };
        });
    
    return MeetingSeries.find({ $and: queries });
}

Template.meetingSeriesList.onCreated(function () {
    this.searchQuery = new ReactiveVar('');
});

Template.meetingSeriesList.helpers({
    meetingSeriesRow() {
        const searchQuery = Template.instance().searchQuery.get();

        if (searchQuery.trim() === '') {
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
