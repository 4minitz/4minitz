import { Template } from "meteor/templating";
import { UserRoles } from "/imports/userroles";
import { MinutesFinder } from "../../../imports/services/minutesFinder";

Template.meetingSeriesOverview.helpers({
  isModeratorOfSeries() {
    const usrRole = new UserRoles();
    return usrRole.isModeratorOf(Template.instance().data._id);
  },

  lastMinutes() {
    const seriesDocumentFromDataContext = this;
    return MinutesFinder.lastMinutesOfMeetingSeries(
      seriesDocumentFromDataContext,
    );
  },
});
