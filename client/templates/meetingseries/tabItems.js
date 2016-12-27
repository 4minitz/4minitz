import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { ItemsFilter } from '/imports/search/ItemsFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';
import { ITEM_KEYWORDS } from '/imports/search/FilterKeywords';

import { createLabelIdsReceiver } from './helpers/tabFilterDatabaseOperations';
import { createUserIdsReceiver } from './helpers/tabFilterDatabaseOperations';

export class TabItemsConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

const FILTERS = [
    {text: 'Info Items', value: 'is:info'},
    {text: 'Action Items', value: 'is:action'},
    {text: 'Open Action Items', value: 'is:action is:open'},
    {text: 'Closed Action Items', value: 'is:action is:closed'},
    {text: 'Your Action Items', value: 'is:action @me'}
];

Template.tabItems.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar("");
    let myTemplate = Template.instance();
    this.topicFilterHandler = (query) => {
        myTemplate.topicFilterQuery.set(query);
    };

    this.itemsFilter = new ItemsFilter();
    this.parser = new QueryParser(
        ITEM_KEYWORDS,
        createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId),
        createUserIdsReceiver
    );
});

Template.tabItems.helpers({

    'getTopicFilterConfig': function() {
        let tmpl = Template.instance();
        return new TopicFilterConfig(tmpl.topicFilterHandler, FILTERS);
    },

    'getInfoItems': function() {
        let tmpl = Template.instance();

        let query = tmpl.topicFilterQuery.get();
        tmpl.parser.reset();
        tmpl.parser.parse(query);

        let items = tmpl.data.topics.reduce(
            (acc, topic) => {
                return acc.concat(topic.infoItems.map((item) => {
                    item.parentTopicId = topic._id;
                    return item;
                }));
            },
            /* initial value */
            []
        );

        return tmpl.itemsFilter.filter(items, tmpl.parser);
    },

    'infoItemData': function(index) {
        return {
            infoItem: this,
            parentTopicId: this.parentTopicId,
            isEditable: false,
            minutesID: Template.instance().data.parentMeetingSeriesId,
            currentCollapseId: this.parentTopicId + "_" + index  // each topic item gets its own collapseID
        };
    }

});
