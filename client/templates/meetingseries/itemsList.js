import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { Label } from '/imports/label';

import { TopicFilter } from '/imports/search/TopicFilter';
import { QueryParser } from '/imports/search/QueryParser';
import { TopicFilterConfig } from '../topic/topicFilter';

export class ItemListConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

Template.itemsList.helpers({

    'getInfoItems': function() {
        let config = Template.instance().data;
        let topics =  config.topics;

        return topics.reduce(
            (acc, topic) => {
                return acc.concat(topic.infoItems.map((item) => {
                    item.parentTopicId = topic._id;
                    return item;
                }));
            },
            [] /* initial value */
        );

        //var query = Template.instance().topicFilterQuery.get();
        //let topics = Template.instance().topicFilter.filter(this.topics, query);
        //return topics;
        /*return topics.reduce(
            (acc, topic) => {
                return acc.concat(topic.infoItems.map((item) => {
                    item.parentTopicId = topic._id;
                    return item;
                }));
            },
            /* initial value *
            []
        );*/
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
