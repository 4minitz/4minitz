import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'

export class ItemListConfig {
    constructor (topics, parentMeetingSeriesId) {
        this.topics = topics;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

Template.itemsList.helpers({

    'getInfoItems': function() {
        let topics = Template.instance().data.topics;
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
