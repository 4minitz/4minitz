import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import moment from "moment/moment";

import { OnlineUsersSchema } from "./onlineusers.schema";

if (Meteor.isServer) {
  Meteor.publish("onlineUsersForRoute", (route) => {
    if (route) {
      return OnlineUsersSchema.find({ activeRoute: route });
    }
    return OnlineUsersSchema.find();
  });
}

const checkRouteParamAndAuthorization = (route, userId) => {
  check(route, String);
  if (!userId) {
    throw new Meteor.Error("not-authorized");
  }
};

Meteor.methods({
  "onlineUsers.enterRoute"(route) {
    const userId = Meteor.userId();
    checkRouteParamAndAuthorization(route, userId);

    OnlineUsersSchema.upsert(
      { userId, activeRoute: route },
      { userId, activeRoute: route, updatedAt: new Date() },
    );

    // remove outdated entries
    const aMinAgo = moment().add(-1, "minutes").toDate();
    OnlineUsersSchema.remove({ updatedAt: { $lt: aMinAgo } });
  },
  "onlineUsers.leaveRoute"(route) {
    const userId = Meteor.userId();
    checkRouteParamAndAuthorization(route, userId);
    OnlineUsersSchema.remove({ userId, activeRoute: route });
  },
});
