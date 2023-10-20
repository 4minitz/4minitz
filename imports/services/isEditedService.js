import { Meteor } from "meteor/meteor";
import "/imports/helpers/promisedMethods";

import { MinutesSchema } from "../collections/minutes.schema";
import { Minutes } from "../minutes";
import { MeetingSeriesSchema } from "../collections/meetingseries.schema";
import { MeetingSeries } from "../meetingseries";
import { Topic } from "../topic";

function setIsEditedMeetingSerie(msId) {
  const ms = new MeetingSeries(msId);

  ms.isEditedBy = Meteor.userId();
  ms.isEditedDate = new Date();

  ms.save();
}

function removeIsEditedMeetingSerie(msId, ignoreLock) {
  let unset = false;
  const ms = new MeetingSeries(msId);

  if (ignoreLock === true) {
    unset = true;
  } else if (ms.isEditedBy === Meteor.userId()) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  ms.isEditedBy = null;
  ms.isEditedDate = null;
  ms.save();
}

function removeIsEditedMinute(minuteId, ignoreLock) {
  const minute = new Minutes(minuteId);
  for (const topic of minute.topics) {
    if (ignoreLock === true) {
      topic.isEditedBy = null;
      topic.isEditedDate = null;
    } else if (topic.isEditedBy === Meteor.userId()) {
      topic.isEditedBy = null;
      topic.isEditedDate = null;
    }
    for (const infoItem of topic.infoItems) {
      if (ignoreLock === true) {
        infoItem.isEditedBy = null;
        infoItem.isEditedDate = null;
      } else if (infoItem.isEditedBy === Meteor.userId()) {
        infoItem.isEditedBy = null;
        infoItem.isEditedDate = null;
      }
      for (const detail of infoItem.details) {
        if (ignoreLock === true) {
          detail.isEditedBy = null;
          detail.isEditedDate = null;
        } else if (detail.isEditedBy === Meteor.userId()) {
          detail.isEditedBy = null;
          detail.isEditedDate = null;
        }
      }
    }
  }
  minute.save();
}

function setIsEditedTopic(minutesId, topicId) {
  const topic = new Topic(minutesId, topicId);

  topic._topicDoc.isEditedBy = Meteor.userId();
  topic._topicDoc.isEditedDate = new Date();

  topic.save();
}

function removeIsEditedTopic(minutesId, topicId, ignoreLock) {
  let unset = false;
  const topic = new Topic(minutesId, topicId);

  if (ignoreLock === true) {
    unset = true;
  } else if (topic._topicDoc.isEditedBy === Meteor.userId()) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  topic._topicDoc.isEditedBy = null;
  topic._topicDoc.isEditedDate = null;
  topic.save();
}

function setIsEditedInfoItem(minutesId, topicId, infoItemId) {
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  infoItem._infoItemDoc.isEditedBy = Meteor.userId();
  infoItem._infoItemDoc.isEditedDate = new Date();

  infoItem.save();
}

function removeIsEditedInfoItem(minutesId, topicId, infoItemId, ignoreLock) {
  let unset = false;
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  if (typeof infoItem === "undefined") {
    return;
  }

  if (ignoreLock === true) {
    unset = true;
  } else if (infoItem._infoItemDoc.isEditedBy === Meteor.userId()) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  infoItem._infoItemDoc.isEditedBy = null;
  infoItem._infoItemDoc.isEditedDate = null;
  infoItem.save();
}

function setIsEditedDetail(minutesId, topicId, infoItemId, detailIdx) {
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  infoItem._infoItemDoc.details[detailIdx].isEditedBy = Meteor.userId();
  infoItem._infoItemDoc.details[detailIdx].isEditedDate = new Date();

  infoItem.save();
}

function removeIsEditedDetail(
  minutesId,
  topicId,
  infoItemId,
  detailIdx,
  ignoreLock,
) {
  let unset = false;
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  if (typeof infoItem === "undefined") {
    return;
  }

  if (ignoreLock === true) {
    unset = true;
  } else if (
    infoItem._infoItemDoc.details[detailIdx].isEditedBy === Meteor.userId()
  ) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  infoItem._infoItemDoc.details[detailIdx].isEditedBy = null;
  infoItem._infoItemDoc.details[detailIdx].isEditedDate = null;
  infoItem.save();
}

Meteor.methods({
  "workflow.setIsEditedMeetingSerie"(msId) {
    setIsEditedMeetingSerie(msId);
  },

  "workflow.removeIsEditedMeetingSerie"(msId, ignoreLock) {
    removeIsEditedMeetingSerie(msId, ignoreLock);
  },

  "workflow.removeIsEditedMinute"(minuteId, ignoreLock) {
    removeIsEditedMinute(minuteId, ignoreLock);
  },

  "workflow.setIsEditedTopic"(minutesId, topicId) {
    setIsEditedTopic(minutesId, topicId);
  },

  "workflow.removeIsEditedTopic"(minutesId, topicId, ignoreLock) {
    removeIsEditedTopic(minutesId, topicId, ignoreLock);
  },

  "workflow.setIsEditedInfoItem"(minutesId, topicId, infoItemId) {
    setIsEditedInfoItem(minutesId, topicId, infoItemId);
  },

  "workflow.removeIsEditedInfoItem"(
    minutesId,
    topicId,
    infoItemId,
    ignoreLock,
  ) {
    removeIsEditedInfoItem(minutesId, topicId, infoItemId, ignoreLock);
  },

  "workflow.setIsEditedDetail"(minutesId, topicId, infoItemId, detailIdx) {
    setIsEditedDetail(minutesId, topicId, infoItemId, detailIdx);
  },

  "workflow.removeIsEditedDetail"(
    minutesId,
    topicId,
    infoItemId,
    detailIdx,
    ignoreLock,
  ) {
    removeIsEditedDetail(minutesId, topicId, infoItemId, detailIdx, ignoreLock);
  },
});

export class IsEditedService {
  static removeIsEditedOnLogout() {
    const allMs = MeetingSeriesSchema.getCollection().find();
    allMs.forEach((meetingSerie) => {
      Meteor.callPromise(
        "workflow.removeIsEditedMeetingSerie",
        meetingSerie._id,
        false,
      );
    });

    const allMinutes = MinutesSchema.getCollection().find();
    allMinutes.forEach((minute) => {
      Meteor.callPromise("workflow.removeIsEditedMinute", minute._id, false);
    });
  }

  static setIsEditedMeetingSerie(msId) {
    Meteor.callPromise("workflow.setIsEditedMeetingSerie", msId);
  }

  static removeIsEditedMeetingSerie(msId, ignoreLock) {
    Meteor.callPromise("workflow.removeIsEditedMeetingSerie", msId, ignoreLock);
  }

  static setIsEditedTopic(minutesId, topicId) {
    Meteor.callPromise("workflow.setIsEditedTopic", minutesId, topicId);
  }

  static removeIsEditedTopic(minutesId, topicId, ignoreLock) {
    Meteor.callPromise(
      "workflow.removeIsEditedTopic",
      minutesId,
      topicId,
      ignoreLock,
    );
  }

  static setIsEditedInfoItem(minutesId, topicId, infoItemId) {
    Meteor.callPromise(
      "workflow.setIsEditedInfoItem",
      minutesId,
      topicId,
      infoItemId,
    );
  }

  static removeIsEditedInfoItem(minutesId, topicId, infoItemId, ignoreLock) {
    Meteor.callPromise(
      "workflow.removeIsEditedInfoItem",
      minutesId,
      topicId,
      infoItemId,
      ignoreLock,
    );
  }

  static setIsEditedDetail(minutesId, topicId, infoItemId, detailIdx) {
    Meteor.callPromise(
      "workflow.setIsEditedDetail",
      minutesId,
      topicId,
      infoItemId,
      detailIdx,
    );
  }

  static removeIsEditedDetail(
    minutesId,
    topicId,
    infoItemId,
    detailIdx,
    ignoreLock,
  ) {
    Meteor.callPromise(
      "workflow.removeIsEditedDetail",
      minutesId,
      topicId,
      infoItemId,
      detailIdx,
      ignoreLock,
    );
  }
}
