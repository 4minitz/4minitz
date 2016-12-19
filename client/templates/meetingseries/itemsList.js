import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { TopicFilter } from '/imports/TopicFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';

export class ItemListConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

function getLabelIdsByName(labelName) {
    let label = Label.findLabelsStartingWithName(Template.instance().data.parentMeetingSeriesId, labelName);
    if (null !== label) {
        return label.map(label => { return label._id; });
    }
    return null;
}

Template.itemsList.onCreated(function() {
    this.topicFilterQuery = new ReactiveVar("");
    this.topicFilterHandler = (query) => {
        this.topicFilterQuery.set(query);
    };
    this.topicFilter = new TopicFilter(new QueryParser(getLabelIdsByName));
});

Template.itemsList.helpers({

    'getTopicFilterConfig': function() {
        return new TopicFilterConfig(Template.instance().topicFilterHandler);
    },

    'getInfoItems': function() {
        var query = Template.instance().topicFilterQuery.get();
        let topics = Template.instance().topicFilter.filter(this.topics, query);
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
