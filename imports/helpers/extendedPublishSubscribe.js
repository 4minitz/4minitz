import { Meteor } from "meteor/meteor";
import { UserRoles } from "./../userroles";

export class extendedPublishSubscribeHandler {
  static publishByMeetingSeriesOrMinute = (
    publishName,
    collection,
    meetingSeriesAttribute,
    minuteAttribute,
  ) => {
    if (Meteor.isServer) {
      Meteor.publish(publishName, function (meetingSeriesId, minuteId) {
        if (meetingSeriesId) {
          const userRole = new UserRoles(this.userId);
          if (userRole.hasViewRoleFor(meetingSeriesId)) {
            const query = minuteId
              ? { [minuteAttribute]: minuteId }
              : { [meetingSeriesAttribute]: meetingSeriesId };
            return collection.find(query).cursor;
          }
        }
        return this.ready();
      });
    }
  };
}
