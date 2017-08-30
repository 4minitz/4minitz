import { Template } from 'meteor/templating';
import { MeetingSeries } from '/imports/meetingseries';
import { Session } from 'meteor/session';

Template.meetingSeriesSearch.events({
    'keyup .meetingSeriesSearchbar': function (event) {
        const target = event.currentTarget;
        const text = target.searchMeetingSeries.value;
        Session.set('search-query', text);
    }
});

Template.meetingSeriesSearch.searchResults = function () {
    let wholeString = Session.get('search-query');
    let split = wholeString.match(/[^\s]+/g);
    if (!split) {
        split = [];
    }
    let query = new RegExp(split.join('|'), 'i');
    return MeetingSeries.find({$or:[{'name': query}, {'project': query}]});
};
