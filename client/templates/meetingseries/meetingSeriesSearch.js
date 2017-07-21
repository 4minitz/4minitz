import { Template } from 'meteor/templating';
import { MeetingSeries } from '/imports/meetingseries';
import { Session } from 'meteor/session'

Template.meetingSeriesSearch.events({
    'keyup .meetingSeriesSearchbar': function (event) {
        const target = event.currentTarget;
        const text = target.searchMeetingSeries.value;
        Session.set("search-query", text);
    }
});

Template.meetingSeriesSearch.searchResults = function () {
    let keyword  = Session.get("search-query");
    let query = new RegExp( keyword, 'i' );
    let results = MeetingSeries.find({$or:[{'name': query}, {'project': query}]});
    return results;
}