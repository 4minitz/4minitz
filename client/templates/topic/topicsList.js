import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'


export class TopicListConfig {
    constructor (topics, minutesId, isReadonly, parentMeetingSeriesId) {
        this.topics = topics;
        this.minutesId = minutesId;
        this.isReadonly = isReadonly;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

let collapseID = 0;
Template.topicsList.helpers({

    'getTopics': function() {
        let config =Template.instance().data;
        return config.topics;
    },

    getTopicElement: function () {
        let config = Template.instance().data;
        return {
            topic: this,
            isEditable: !config.isReadonly,
            minutesID: config.minutesId,
            currentCollapseId: collapseID++,  // each topic item gets its own collapseID,
            parentMeetingSeriesId: config.parentMeetingSeriesId
        };
    }

});
