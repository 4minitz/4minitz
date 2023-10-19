import { handleError } from "/client/helpers/handleError";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { createTopic } from "./helpers/create-topic";

export class TopicListConfig {
  constructor(topics, minutesId, isReadonly, parentMeetingSeriesId) {
    this.topics = topics;
    this.minutesId = minutesId;
    this.isReadonly = isReadonly;
    this.parentMeetingSeriesId = parentMeetingSeriesId;
  }
}

let collapseID = 0;
Template.topicsList.helpers({
  getTopics() {
    const config = Template.instance().data;
    return config.topics;
  },

  getTopicElement() {
    const config = Template.instance().data;
    return {
      topic: this,
      isEditable: !config.isReadonly,
      minutesID: config.minutesId,
      currentCollapseId: collapseID++, // each topic item gets its own collapseID,
      parentMeetingSeriesId: config.parentMeetingSeriesId,
    };
  },

  isReadOnlyMode() {
    return Template.instance().data.isReadonly;
  },
});

Template.topicsList.events({
  "submit #addTopicForm": function (evt, tmpl) {
    evt.preventDefault();

    if (tmpl.data.isReadonly) {
      throw new Meteor.Error("illegal-state", i18n.__("Topic.illegalAction"));
    }

    const topicDoc = {
      subject: tmpl.find("#addTopicField").value,
      responsibles: [],
    };
    const aTopic = createTopic(
      tmpl.data.minutesId,
      this.parentMeetingSeriesId,
      topicDoc,
    );

    aTopic.saveAtBottom().catch((error) => {
      tmpl.find("#addTopicField").value = topicDoc.subject; // set desired value again!
      handleError(error);
    });
    tmpl.find("#addTopicField").value = "";

    // Scroll "add topic" edit field into view
    // We need a timeout here, to give meteor time to add the new topic field
    // first
    Meteor.setTimeout(() => {
      const elem = document.getElementById("addTopicToBottomDIV");
      if (elem) {
        elem.scrollIntoView(false); // false => bottom will be aligned
      }
    }, 1);
  },
});
