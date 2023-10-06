import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { check } from "meteor/check";
import { MeetingSeriesSchema } from "./meetingseries.schema";
import { Roles } from "meteor/alanning:roles";
import { UserRoles } from "./../userroles";
import { GlobalSettings } from "../config/GlobalSettings";
import { formatDateISO8601 } from "/imports/helpers/date";
import { RoleChangeMailHandler } from "../mail/RoleChangeMailHandler";

if (Meteor.isServer) {
  // this will publish a light-weighted overview of the meeting series, necessary for the meeting series list
  Meteor.publish("meetingSeriesOverview", function meetingSeriesPublication() {
    return MeetingSeriesSchema.find(
      { visibleFor: { $in: [this.userId] } },
      {
        fields: {
          project: 1,
          name: 1,
          minutes: 1,
          lastMinutesDate: 1,
          lastMinutesFinalized: 1,
          lastMinutesId: 1,
          availableLabels: 1,
        },
      },
    );
  });

  //this will publish the full information for a single meeting series
  Meteor.publish(
    "meetingSeriesDetails",
    function meetingSeriesPublication(meetingSeriesId) {
      if (meetingSeriesId) {
        return MeetingSeriesSchema.find({
          $and: [
            { visibleFor: { $in: [this.userId] } },
            { _id: meetingSeriesId },
          ],
        });
      }

      return this.ready();
    },
  );
}

Meteor.methods({
  "meetingseries.insert"(doc, optimisticUICallback) {
    console.log("meetingseries.insert");

    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
      throw new Meteor.Error(
        "not-authorized",
        "You are not authorized to perform this action.",
      );
    }

    // the user should not be able to define the date when this series was create - or should he?
    // -> so we overwrite this field if it was set previously
    const currentDate = new Date();
    doc.createdAt = currentDate;
    doc.lastMinutesDate = formatDateISO8601(currentDate);

    // limit visibility of this meeting series (see server side publish)
    // array will be expanded by future invites
    doc.visibleFor = [Meteor.userId()];

    if (!Meteor.isClient) {
      // copy the default labels to the series
      doc.availableLabels = GlobalSettings.getDefaultLabels();
      doc.availableLabels.forEach((label) => {
        label._id = Random.id();
        label.isDefaultLabel = true;
        label.isDisabled = false;
      });
    }

    // Every logged in user is allowed to create a new meeting series.

    try {
      const newMeetingSeriesID = MeetingSeriesSchema.insert(doc);

      // Make creator of this meeting series the first moderator
      Roles.addUsersToRoles(
        Meteor.userId(),
        UserRoles.USERROLES.Moderator,
        newMeetingSeriesID,
      );

      if (Meteor.isClient && optimisticUICallback) {
        optimisticUICallback(newMeetingSeriesID);
      }

      return newMeetingSeriesID;
    } catch (error) {
      if (!Meteor.isClient) {
        // the simulation ignores exceptions which will be thrown...
        console.error(error);
        throw error;
      }
    }
  },

  "meetingseries.update"(doc) {
    if (!doc) {
      console.log("meetingseries.update: no data given");
      return;
    }

    console.log("meetingseries.update:", doc.minutes);

    const id = doc._id;
    check(id, String);
    delete doc._id; // otherwise collection.update will fail
    if (!id) {
      return;
    }

    // these attributes should only be manipulated by specific workflow-methods
    delete doc.minutes;
    delete doc.topics;
    delete doc.openTopics;

    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    // Ensure user can not update documents of other users
    const userRoles = new UserRoles(Meteor.userId());
    if (!userRoles.isModeratorOf(id)) {
      throw new Meteor.Error(
        "Cannot update meeting series",
        "You are not moderator of this meeting series.",
      );
    }

    try {
      return MeetingSeriesSchema.update(id, { $set: doc });
    } catch (e) {
      if (!Meteor.isClient) {
        console.error(e);
        throw new Meteor.Error(
          "runtime-error",
          "Error updating meeting series collection",
          e,
        );
      }
    }
  },

  "meetingseries.sendRoleChange"(userId, oldRole, newRole, meetingSeriesId) {
    // Make sure the user is logged in before trying to send mails
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    // Ensure user is Moderator of the meeting series
    const userRole = new UserRoles(Meteor.userId());
    if (userRole.isModeratorOf(meetingSeriesId)) {
      if (!GlobalSettings.isEMailDeliveryEnabled()) {
        console.log(
          "Skip sending mails because email delivery is not enabled. To enable email delivery set enableMailDelivery to true in your settings.json file",
        );
        throw new Meteor.Error(
          "Cannot send role change mail",
          "Email delivery is not enabled in your 4minitz installation.",
        );
      }

      if (Meteor.isServer) {
        const roleChangeMailHandler = new RoleChangeMailHandler(
          userId,
          oldRole,
          newRole,
          Meteor.user(),
          meetingSeriesId,
        );
        roleChangeMailHandler.send();
      }
    } else {
      throw new Meteor.Error(
        "Cannot send E-Mails for role change",
        "You are not a moderator of the meeting series.",
      );
    }
  },
});
