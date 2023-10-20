import "/imports/helpers/promisedMethods";

import { MeetingSeriesSchema } from "/imports/collections/meetingseries.schema";
import { MinutesSchema } from "/imports/collections/minutes.schema";
import { GlobalSettings } from "/imports/config/GlobalSettings";
import { formatDateISO8601Time } from "/imports/helpers/date";
import { FinalizeMailHandler } from "/imports/mail/FinalizeMailHandler";
import { Minutes } from "/imports/minutes";
import { MinutesFinder } from "/imports/services/minutesFinder";
import { User } from "/imports/user";
import { UserRoles } from "/imports/userroles";
import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";

import { TopicsFinalizer } from "./topicsFinalizer";

// todo merge with finalizer copy
function checkUserAvailableAndIsModeratorOf(meetingSeriesId) {
  // Make sure the user is logged in before changing collections
  if (!Meteor.userId()) {
    throw new Meteor.Error(
      "not-authorized",
      "You are not authorized to perform this action.",
    );
  }

  // Ensure user can not update documents of other users
  const userRoles = new UserRoles(Meteor.userId());
  if (!userRoles.isModeratorOf(meetingSeriesId)) {
    throw new Meteor.Error(
      "Cannot modify this minutes/series",
      "You are not a moderator of the meeting series.",
    );
  }
}

function sendFinalizationMail(minutes, sendActionItems, sendInfoItems) {
  if (!GlobalSettings.isEMailDeliveryEnabled()) {
    console.log(
      "Skip sending mails because email delivery is not enabled. To enable email delivery set " +
        "enableMailDelivery to true in your settings.json file",
    );
    return;
  }

  const emails = Meteor.user().emails;
  const i18nLocale = i18n.getLocale(); // we have to remember this, as it will not
  // survive the Meteor.defer()
  Meteor.defer(() => {
    // server background tasks after successfully updated the minute doc
    const senderEmail =
      emails && emails.length > 0
        ? emails[0].address
        : GlobalSettings.getDefaultEmailSenderAddress();
    i18n.setLocale(i18nLocale);
    const finalizeMailHandler = new FinalizeMailHandler(minutes, senderEmail);
    finalizeMailHandler.sendMails(sendActionItems, sendInfoItems);
  });
}

function removeIsEdited(aMin) {
  for (const topic of aMin.topics) {
    topic.isEditedBy = null;
    topic.isEditedDate = null;
    for (const infoItem of topic.infoItems) {
      infoItem.isEditedBy = null;
      infoItem.isEditedDate = null;
      for (const detail of infoItem.details) {
        detail.isEditedBy = null;
        detail.isEditedDate = null;
      }
    }
  }
}

function compileFinalizedInfo(minutes) {
  if (!minutes.finalizedAt) {
    return "Never finalized";
  }

  const finalizedTimestamp = formatDateISO8601Time(minutes.finalizedAt);
  const finalizedString = minutes.isFinalized ? "Finalized" : "Unfinalized";
  const version = minutes.finalizedVersion
    ? `Version ${minutes.finalizedVersion}. `
    : "";

  return `${version}${finalizedString} on ${finalizedTimestamp} by ${minutes.finalizedBy}`;
}

Meteor.methods({
  "workflow.finalizeMinute"(id, sendActionItems, sendInfoItems) {
    console.log(`workflow.finalizeMinute on ${id}`);
    check(id, String);

    const minutes = new Minutes(id);
    // check if minute is already finalized
    if (minutes.isFinalized) {
      throw new Meteor.Error(
        "runtime-error",
        "The minute is already finalized",
      );
    }

    removeIsEdited(minutes);

    checkUserAvailableAndIsModeratorOf(minutes.parentMeetingSeriesID());

    // We have to remember the sort order of the current minute
    // to restore this order in the next future meeting minute
    if (minutes.topics) {
      for (let i = 0; i < minutes.topics.length; i++) {
        minutes.topics[i].sortOrder = i;
      }
      minutes.save();
    }

    // first we copy the topics of the finalize-minute to the parent series
    TopicsFinalizer.mergeTopicsForFinalize(
      minutes.parentMeetingSeries(),
      minutes.visibleFor,
    );

    // then we tag the minute as finalized
    const version = minutes.finalizedVersion + 1 || 1;

    const doc = {
      finalizedAt: new Date(),
      finalizedBy: User.PROFILENAMEWITHFALLBACK(Meteor.user()),
      isFinalized: true,
      finalizedVersion: version,
    };

    // update minutes object to generate new history entry
    Object.assign(minutes, doc);

    const history = minutes.finalizedHistory || [];
    history.push(compileFinalizedInfo(minutes));
    doc.finalizedHistory = history;

    const affectedDocs = MinutesSchema.update(id, { $set: doc });
    if (affectedDocs === 1 && !Meteor.isClient) {
      sendFinalizationMail(minutes, sendActionItems, sendInfoItems);
    }

    // update meeting series fields to correctly resemble the finalized status
    // of the minute
    minutes.parentMeetingSeries().updateLastMinutesFieldsAsync();

    console.log("workflow.finalizeMinute DONE.");
  },

  "workflow.unfinalizeMinute"(id) {
    console.log(`workflow.unfinalizeMinute on ${id}`);
    check(id, String);

    const minutes = new Minutes(id);
    checkUserAvailableAndIsModeratorOf(minutes.parentMeetingSeriesID());

    // it is not allowed to un-finalize a minute if it is not the last finalized
    // one
    const parentSeries = minutes.parentMeetingSeries();
    if (!Finalizer.isUnfinalizeMinutesAllowed(id)) {
      throw new Meteor.Error(
        "not-allowed",
        "This minutes is not allowed to be un-finalized.",
      );
    }

    TopicsFinalizer.mergeTopicsForUnfinalize(parentSeries, minutes.visibleFor);

    const doc = {
      finalizedAt: new Date(),
      finalizedBy: User.PROFILENAMEWITHFALLBACK(Meteor.user()),
      isFinalized: false,
    };

    // update minutes object to generate new history entry
    Object.assign(minutes, doc);

    const history = minutes.finalizedHistory || [];
    history.push(compileFinalizedInfo(minutes));
    doc.finalizedHistory = history;

    console.log("workflow.unfinalizeMinute DONE.");
    const result = MinutesSchema.update(id, { $set: doc });

    // update meeting series fields to correctly resemble the finalized status
    // of the minute
    parentSeries.updateLastMinutesFieldsAsync();

    return result;
  },
});

export class Finalizer {
  static finalize(minutesId, sendActionItems, sendInfoItems, onErrorCallback) {
    Meteor.call(
      "workflow.finalizeMinute",
      minutesId,
      sendActionItems,
      sendInfoItems,
    );
    // save protocol if enabled
    if (Meteor.settings.public.docGeneration.enabled) {
      Meteor.call(
        "documentgeneration.createAndStoreFile",
        minutesId,
        (error) => {
          if (error) {
            error.reason = error.reason ? error.reason : error.error;
            onErrorCallback(error);
          }
        },
      );
    }
  }

  static unfinalize(minutesId) {
    Meteor.call("workflow.unfinalizeMinute", minutesId);
    // remove protocol if enabled
    if (Meteor.settings.public.docGeneration.enabled) {
      Meteor.call("documentgeneration.removeFile", minutesId);
    }
  }

  static finalizedInfo(minutesId) {
    const minutes = MinutesSchema.findOne(minutesId);
    return compileFinalizedInfo(minutes);
  }

  static isUnfinalizeMinutesAllowed(minutesId) {
    const minutes = MinutesSchema.findOne(minutesId);
    const meetingSeries = MeetingSeriesSchema.findOne(minutes.meetingSeries_id);
    const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(meetingSeries);

    return lastMinutes && lastMinutes._id === minutesId;
  }
}
