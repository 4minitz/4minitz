import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Minutes } from "../minutes";
import { UserRoles } from "./../userroles";
import { User } from "../user";
import { MinutesSchema } from "./minutes.schema";
import { TopicSchema } from "./topic.schema";
import { SendAgendaMailHandler } from "../mail/SendAgendaMailHandler";
import { GlobalSettings } from "../config/GlobalSettings";

if (Meteor.isServer) {
  Meteor.publish(
    "minutes",
    function minutesPublication(meetingSeriesId, minuteId) {
      if (minuteId) {
        return MinutesSchema.find({
          $and: [{ visibleFor: { $in: [this.userId] } }, { _id: minuteId }],
        });
      }
      if (meetingSeriesId) {
        return MinutesSchema.find({
          $and: [
            { visibleFor: { $in: [this.userId] } },
            { meetingSeries_id: meetingSeriesId },
          ],
        });
      }
      return this.ready();
    },
  );
}

Meteor.methods({
  "minutes.sendAgenda"(id) {
    check(id, String);
    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    // Ensure user is moderator before sending the agenda
    let userRoles = new UserRoles(Meteor.userId());
    let aMin = new Minutes(id);
    if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
      if (!GlobalSettings.isEMailDeliveryEnabled()) {
        console.log(
          "Skip sending mails because email delivery is not enabled. To enable email delivery set enableMailDelivery to true in your settings.json file",
        );
        throw new Meteor.Error(
          "Cannot send agenda",
          "Email delivery is not enabled in your 4minitz installation.",
        );
      }

      if (!Meteor.isClient) {
        let emails = Meteor.user().emails;
        let senderEmail =
          emails && emails.length > 0
            ? emails[0].address
            : GlobalSettings.getDefaultEmailSenderAddress();
        let sendAgendaMailHandler = new SendAgendaMailHandler(
          senderEmail,
          aMin,
        );
        sendAgendaMailHandler.send();

        MinutesSchema.update(
          { _id: aMin._id, isFinalized: false },
          { $set: { agendaSentAt: new Date() } },
        );

        return sendAgendaMailHandler.getCountRecipients();
      }
    } else {
      throw new Meteor.Error(
        "Cannot send agenda",
        "You are not moderator of the parent meeting series.",
      );
    }
  },

  "minutes.update"(doc) {
    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    let id = doc._id;
    check(id, String);
    delete doc._id; // otherwise collection.update will fail

    if (id === undefined || id === "") {
      return;
    }

    // #Security & Consistency:
    // delete properties which should not be modified by the client
    // these properties are only allowed to be modified serverside by workflow_private methods
    delete doc.finalizedAt;
    delete doc.createdAt;
    delete doc.isFinalized;
    delete doc.finalizedVersion;
    delete doc.finalizedHistory;

    let aMin = new Minutes(id);
    if (doc.date) {
      if (!aMin.parentMeetingSeries().isMinutesDateAllowed(id, doc.date)) {
        return;
      }
    }

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
      // Ensure user can not update finalized minutes

      return MinutesSchema.update(
        { _id: id, isFinalized: false },
        { $set: doc },
      );
    } else {
      throw new Meteor.Error(
        "Cannot update minutes",
        "You are not moderator of the parent meeting series.",
      );
    }
  },

  /**
   * Update a single topic document identified by its id.
   * In this case the topic id identifies a single topic because we
   * can only update topics of a finalized minute the older copies of
   * the topic (with the same id) live in finalized minutes.
   *
   * @param topicId
   * @param doc
   * @returns {*|any}
   */
  "minutes.updateTopic"(topicId, doc) {
    check(topicId, String);
    console.log(`updateTopic: ${topicId}`);

    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
      throw new Meteor.Error(
        "not-authorized",
        "You are not authorized to perform this action.",
      );
    }

    doc.updatedAt = new Date();
    doc.updatedBy = User.PROFILENAMEWITHFALLBACK(Meteor.user());

    let modifierDoc = {};
    for (let property in doc) {
      if (Object.prototype.hasOwnProperty.call(doc, property)) {
        modifierDoc["topics.$." + property] = doc[property];
      }
    }

    let minDoc = MinutesSchema.findOne({
      isFinalized: false,
      "topics._id": topicId,
    });
    let aMin = new Minutes(minDoc);

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
      // Ensure user can not update finalized minutes

      return MinutesSchema.update(
        { _id: aMin._id, isFinalized: false, "topics._id": topicId },
        { $set: modifierDoc },
      );
    } else {
      throw new Meteor.Error(
        "Cannot update minutes",
        "You are not moderator of the parent meeting series.",
      );
    }
  },

  "minutes.addTopic"(minutesId, doc, insertPlacementTop) {
    check(minutesId, String);
    console.log(`addTopic to minute: ${minutesId}`);

    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
      throw new Meteor.Error(
        "not-authorized",
        "You are not authorized to perform this action.",
      );
    }

    let aMin = new Minutes(minutesId);

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
      // Ensure user can not update finalized minutes

      let topicAlreadyExists = Boolean(aMin.findTopic(doc._id));
      if (topicAlreadyExists) {
        throw new Meteor.Error("invalid-argument", "Topic already exists");
      }

      doc.createdInMinute = minutesId;
      doc.createdAt = new Date();
      doc.createdBy = User.PROFILENAMEWITHFALLBACK(Meteor.user());
      doc.updatedAt = new Date();
      doc.updatedBy = User.PROFILENAMEWITHFALLBACK(Meteor.user());

      let topicModifier = {
        topics: {
          $each: [doc],
        },
      };

      if (insertPlacementTop) {
        topicModifier.topics.$position = 0;
      }

      return MinutesSchema.update(
        { _id: minutesId, isFinalized: false },
        { $push: topicModifier },
      );
    } else {
      throw new Meteor.Error(
        "Cannot update minutes",
        "You are not moderator of the parent meeting series.",
      );
    }
  },

  "minutes.removeTopic"(topicId) {
    check(topicId, String);
    console.log(`remove topic: ${topicId}`);

    // Make sure the user is logged in before changing collections
    if (!Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    let minDoc = MinutesSchema.findOne({
      isFinalized: false,
      "topics._id": topicId,
    });
    let aMin = new Minutes(minDoc);

    // Ensure user can not update documents of other users
    let userRoles = new UserRoles(Meteor.userId());
    if (!userRoles.isModeratorOf(aMin.parentMeetingSeriesID())) {
      throw new Meteor.Error(
        "Cannot delete topic",
        "You are not moderator of the parent meeting series.",
      );
    }

    // Ensure only topics created within the current minutes (=the last not-finalized one) can be deleted
    let topic = aMin.findTopic(topicId);
    if (topic.createdInMinute !== aMin._id) {
      throw new Meteor.Error(
        "Cannot delete topic",
        "The topic was not created in this minutes.",
      );
    }

    // Ensure user can not update finalized minutes
    return MinutesSchema.update(
      { _id: aMin._id, isFinalized: false },
      {
        $pull: {
          topics: { _id: topicId },
        },
      },
    );
  },

  "minutes.syncVisibilityAndParticipants"(parentSeriesID, visibleForArray) {
    check(parentSeriesID, String);
    let userRoles = new UserRoles(Meteor.userId());
    if (userRoles.isModeratorOf(parentSeriesID)) {
      Minutes.updateVisibleForAndParticipantsForAllMinutesOfMeetingSeries(
        parentSeriesID,
        visibleForArray,
      );
      TopicSchema.update(
        { parentId: parentSeriesID },
        { $set: { visibleFor: visibleForArray } },
        { multi: true },
      );
    } else {
      throw new Meteor.Error(
        "Cannot sync visibility of minutes",
        "You are not moderator of the parent meeting series.",
      );
    }
  },

  responsiblesSearch(partialName, participants) {
    check(partialName, String);
    let results_participants = []; // get all the participants for the minute
    let foundPartipantsNames = [];

    participants.forEach((participant) => {
      if (participant.text.toLowerCase().includes(partialName.toLowerCase())) {
        participant["isParticipant"] = true;
        results_participants.push(participant);
        let name = participant.text.split(" - ");
        foundPartipantsNames.push(name[0]);
      }
    });

    let searchSettings = { username: { $regex: partialName, $options: "i" } };
    let searchFields = { _id: 1, username: 1 };
    if (GlobalSettings.isTrustedIntranetInstallation()) {
      searchSettings = {
        $or: [
          { username: { $regex: partialName, $options: "i" } },
          { "profile.name": { $regex: partialName, $options: "i" } },
        ],
      };
      searchFields = { _id: 1, username: 1, "profile.name": 1 };
    }

    let results_otherUser = Meteor.users
      .find(searchSettings, {
        limit: 10 + results_participants.length, //we want to show 10 "Other user"
        // as it is not known, if a user a participant or not -> get 10+participants
        fields: searchFields,
      })
      .fetch();

    results_otherUser = results_otherUser.filter((user) => {
      //remove duplicates
      return !foundPartipantsNames.includes(user.username);
    });
    results_otherUser = results_otherUser.slice(0, 10); // limit to 10 records

    results_otherUser = results_otherUser.map((otherUser) => {
      return Minutes.formatResponsibles(
        otherUser,
        "username",
        GlobalSettings.isTrustedIntranetInstallation(),
      );
    });
    return {
      results: results_participants.concat(results_otherUser),
    };
  },
});
