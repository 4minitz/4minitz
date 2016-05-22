import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'


export class TopicListConfig {
    constructor (topics, minutesId, isReadonly) {
        this.topics = topics;
        this.minutesId = minutesId;
        this.isReadonly = isReadonly;
    }
}

Template.topicsList.onRendered(function() {
    $.material.init();

    $('#accordion').sortable({
        appendTo: document.body,
        axis: 'y',
        items: '> .well',
        opacity: 0.5
    });
});

Template.topicsList.onDestroyed(function() {
    //add your statement here
});

let collapseID = 0;
Template.topicsList.helpers({

    'getTopics': function() {
        let config = Template.instance().data;
        return config.topics;
    },

    getTopicElement: function () {
        let config = Template.instance().data;
        return {
            topic: this,
            isEditable: !config.isReadonly,
            minutesID: config.minutesId,
            currentCollapseId: collapseID++  // each topic item gets its own collapseID
        };
    }

});
