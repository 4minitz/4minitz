import { UserRoles } from "/imports/userroles";
import { Template } from "meteor/templating";

import { MinutesFinder } from "../../../imports/services/minutesFinder";

Template.meetingSeriesOverview.helpers({
  isModeratorOfSeries() {
    const usrRole = new UserRoles();
    return usrRole.isModeratorOf(Template.instance().data._id);
  },

  lastMinutes() {
    return MinutesFinder.lastMinutesOfMeetingSeries(this);
  },
});
