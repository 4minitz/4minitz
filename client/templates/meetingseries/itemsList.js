import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var'

import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'

import { TopicFilter } from '/imports/TopicFilter'
import { TopicFilterConfig } from '../topic/topicFilter'

export class ItemListConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

Template.itemsList.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar("");
    this.topicFilterHandler = (query) => {
        this.topicFilterQuery.set(query);
    };
});

Template.itemsList.helpers({

    'getTopicFilterConfig': function() {
        return new TopicFilterConfig(Template.instance().topicFilterHandler);
    },

    'getInfoItems': function() {
        var query = Template.instance().topicFilterQuery.get();
        let topics = TopicFilter.filter(this.topics, query);
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
