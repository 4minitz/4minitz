import { Meteor } from "meteor/meteor";
import { OnlineUsersSchema } from "./onlineusers.schema";
import { check } from "meteor/check";
import moment from "moment/moment";

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
      { userId: userId, activeRoute: route },
      { userId: userId, activeRoute: route, updatedAt: new Date() },
    );

    // remove outdated entries
    const aMinAgo = moment().add(-1, "minutes").toDate();
    OnlineUsersSchema.remove({ updatedAt: { $lt: aMinAgo } });
  },
  "onlineUsers.leaveRoute"(route) {
    const userId = Meteor.userId();
    checkRouteParamAndAuthorization(route, userId);
    OnlineUsersSchema.remove({ userId: userId, activeRoute: route });
  },
});
