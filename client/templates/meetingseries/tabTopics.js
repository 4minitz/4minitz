import { TOPIC_KEYWORDS } from "/imports/search/FilterKeywords";
import { QueryParser } from "/imports/search/QueryParser";
import { TopicsFilter } from "/imports/search/TopicsFilter";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { FilterControlConfig } from "../globals/ui-controls/filterControl";
import { TopicListConfig } from "../topic/topicsList";

import {
  createLabelIdsReceiver,
  createUserIdsReceiver,
} from "./helpers/tabFilterDatabaseOperations";

export class TabTopicsConfig {
  constructor(topics, parentMeetingSeriesId) {
    this.topics = topics;
    this.parentMeetingSeriesId = parentMeetingSeriesId;
  }
}

Template.tabTopics.onCreated(function () {
  this.topicFilterQuery = new ReactiveVar("");
  let myTemplate = Template.instance();
  this.topicFilterHandler = (query) => {
    myTemplate.topicFilterQuery.set(query);
  };
  this.topicFilter = new TopicsFilter();
  this.parser = new QueryParser(
    TOPIC_KEYWORDS,
    createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId),
    createUserIdsReceiver,
  );
});

Template.tabTopics.helpers({
  getTopicFilterConfig: function () {
    const FILTERS = [
      { text: i18n.__("Topic.Filter.uncompleted"), value: "is:uncompleted" },
      { text: i18n.__("Topic.Filter.completed"), value: "is:completed" },
      { text: i18n.__("Topic.Filter.yourTopic"), value: "@me" },
    ];
    return new FilterControlConfig(
      Template.instance().topicFilterHandler,
      FILTERS,
      TOPIC_KEYWORDS,
      "Topic-Filter",
    );
  },

  topicViewData: function () {
    let tmpl = Template.instance();
    let query = tmpl.topicFilterQuery.get();
    tmpl.parser.reset();
    tmpl.parser.parse(query);

    let topics = tmpl.topicFilter.filter(tmpl.data.topics, tmpl.parser);
    return new TopicListConfig(
      topics,
      null,
      true,
      tmpl.data.parentMeetingSeriesId,
    );
  },
});
