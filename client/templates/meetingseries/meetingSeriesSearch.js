import { Template } from "meteor/templating";

Template.meetingSeriesSearch.events({
  "keyup .meetingSeriesSearchbar": function (event) {
    const target = event.currentTarget;
    const text = target.searchMeetingSeries.value;

    Template.instance().data.updateSearchQuery(text);
  },
});
