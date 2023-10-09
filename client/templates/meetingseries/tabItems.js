import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { ItemsFilter } from "/imports/search/ItemsFilter";
import { QueryParser } from "/imports/search/QueryParser";
import { FilterControlConfig } from "../globals/ui-controls/filterControl";
import { ITEM_KEYWORDS } from "/imports/search/FilterKeywords";

import { TopicInfoItemListContext } from "../topic/topicInfoItemList";

import {
  createLabelIdsReceiver,
  createUserIdsReceiver,
} from "./helpers/tabFilterDatabaseOperations";
export class TabItemsConfig {
  constructor(topics, parentMeetingSeriesId) {
    this.topics = topics;
    this.parentMeetingSeriesId = parentMeetingSeriesId;
  }
}

Template.tabItems.onCreated(function () {
  this.topicFilterQuery = new ReactiveVar("");
  const myTemplate = Template.instance();
  this.topicFilterHandler = (query) => {
    myTemplate.topicFilterQuery.set(query);
  };

  this.itemsFilter = new ItemsFilter();
  this.parser = new QueryParser(
    ITEM_KEYWORDS,
    createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId),
    createUserIdsReceiver,
  );
});

Template.tabItems.helpers({
  getTopicFilterConfig() {
    const FILTERS = [
      { text: i18n.__("Item.Filter.info"), value: "is:info" },
      { text: i18n.__("Item.Filter.action"), value: "is:action" },
      { text: i18n.__("Item.Filter.open"), value: "is:action is:open" },
      { text: i18n.__("Item.Filter.closed"), value: "is:action is:closed" },
      { text: i18n.__("Item.Filter.yourAction"), value: "is:action @me" },
    ];
    const tmpl = Template.instance();
    return new FilterControlConfig(
      tmpl.topicFilterHandler,
      FILTERS,
      ITEM_KEYWORDS,
      "Item-Filter",
    );
  },

  getInfoItemListContext() {
    const tmpl = Template.instance();

    const query = tmpl.topicFilterQuery.get();
    tmpl.parser.reset();
    tmpl.parser.parse(query);

    const items = tmpl.data.topics
      .reduce(
        (acc, topic) => {
          return acc.concat(
            topic.infoItems.map((item) => {
              item.parentTopicId = topic._id;
              return item;
            }),
          );
        },
        /* initial value */
        [],
      )
      .sort((itemL, itemR) => {
        return itemR.updatedAt.getTime() - itemL.updatedAt.getTime();
      });

    return TopicInfoItemListContext.createReadonlyContextForItemsOfDifferentTopics(
      tmpl.itemsFilter.filter(items, tmpl.parser),
      tmpl.data.parentMeetingSeriesId,
    );
  },
});
