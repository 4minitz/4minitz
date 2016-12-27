import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { TopicFilter } from '/imports/search/TopicFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';

import { createLabelIdsReceiver } from './helpers/tabFilterDatabaseOperations';
import { createUserIdsReceiver } from './helpers/tabFilterDatabaseOperations';

export class TabItemsConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

Template.tabItems.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar("");
    let myTemplate = Template.instance();
    this.topicFilterHandler = (query) => {
        myTemplate.topicFilterQuery.set(query);
    };
    this.topicFilter = new TopicFilter(
        new QueryParser(createLabelIdsReceiver(myTemplate.data.parentMeetingSeriesId), createUserIdsReceiver));
});

Template.tabItems.helpers({

    'getTopicFilterConfig': function() {
        let tmpl = Template.instance();
        return new TopicFilterConfig(tmpl.topicFilterHandler);
    },

    'getInfoItems': function() {
        let tmpl = Template.instance();

        let query = tmpl.topicFilterQuery.get();
        let topics = tmpl.topicFilter.filter(tmpl.data.topics, query);
        //return topics;
        return topics.reduce(
            (acc, topic) => {
                return acc.concat(topic.infoItems.map((item) => {
                    item.parentTopicId = topic._id;
                    return item;
                }));
            },
            /* initial value */
            []
        );
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
