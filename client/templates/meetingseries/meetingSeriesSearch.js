import { Template } from 'meteor/templating';
import { MeetingSeries } from '/imports/meetingseries';

Template.meetingSeriesSearch.events({
    'keyup .meetingSeriesSearchbar': function (event) {
        const target = event.currentTarget;
        const text = target.searchMeetingSeries.value;

        Template.instance().data.updateSearchQuery(text);
    }
});