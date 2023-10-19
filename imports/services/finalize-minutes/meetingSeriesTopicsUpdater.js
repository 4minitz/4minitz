import { TopicSchema } from "/imports/collections/topic.schema";
import { Meteor } from "meteor/meteor";

import { Minutes } from "../../minutes";
import { TopicsFinder } from "../topicsFinder";

export class MeetingSeriesTopicsUpdater {
  /**
   * @param meetingSeriesId
   * @param topicsVisibleFor array of user_ids states which user should be able
   *     to see these topics
   */
  constructor(meetingSeriesId, topicsVisibleFor) {
    this.meetingSeriesId = meetingSeriesId;
    this.topicsVisibleFor = topicsVisibleFor;
  }

  invalidateIsNewFlagOfTopicsPresentedInMinutes(minutesId) {
    const minutes = new Minutes(minutesId);
    const topicIds = minutes.topics.map((topicDoc) => {
      return topicDoc._id;
    });
    TopicsFinder.allTopicsIdentifiedById(topicIds).forEach((topicDoc) => {
      topicDoc.isNew = false;
      topicDoc.infoItems.forEach((itemDoc) => {
        itemDoc.isNew = false;
        itemDoc.details = itemDoc.details || [];
        itemDoc.details.forEach((detail) => {
          detail.isNew = false;
        });
      });
      this.upsertTopic(topicDoc);
    });
  }

  getTopicById(topicId) {
    return TopicsFinder.getTopicById(topicId, this.meetingSeriesId);
  }

  upsertTopic(topicDoc) {
    topicDoc.parentId = this.meetingSeriesId;
    const topicId = topicDoc._id;
    topicDoc.visibleFor = this.topicsVisibleFor;
    TopicSchema.upsert(
      { parentId: this.meetingSeriesId, _id: topicId },
      topicDoc,
    );
  }

  removeTopicsCreatedInMinutes(minutesId) {
    TopicSchema.remove({
      parentId: this.meetingSeriesId,
      createdInMinute: minutesId,
    });
  }

  removeTopicItemsCreatedInMinutes(minutesId) {
    TopicsFinder.allTopicsOfMeetingSeriesWithAtLeastOneItemCreatedInMinutes(
      this.meetingSeriesId,
      minutesId,
    ).forEach((topicDoc) => {
      topicDoc.infoItems = topicDoc.infoItems.filter((infoItemDoc) => {
        return infoItemDoc.createdInMinute !== minutesId;
      });
      this.upsertTopic(topicDoc);
    });
  }

  removeAllTopics() {
    TopicSchema.remove({ parentId: this.meetingSeriesId });
  }

  reOpenTopic(topicId) {
    try {
      const affectedDocuments = TopicSchema.update(
        { parentId: this.meetingSeriesId, _id: topicId },
        { $set: { isOpen: true } },
      );
      if (affectedDocuments !== 1) {
        throw new Meteor.Error("runtime-error", "Could not re-open topic.");
      }
    } catch (e) {
      console.log("Error in reOpenTopic ", topicId);
      console.log(JSON.stringify(e));
      throw new Meteor.Error("runtime-error", "Could not re-open topic.");
    }
  }
}
