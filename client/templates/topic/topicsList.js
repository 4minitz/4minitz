import { Meteor } from 'meteor/meteor';

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
    },
    
    isReadOnlyMode: function() {
        return Template.instance().data.isReadonly;
    }

});

Template.topicsList.events({
    'submit #addTopicForm': function(evt, tmpl) {
        evt.preventDefault();

        if (tmpl.data.isReadonly) {
            throw new Meteor.Error('illegal-state', 'Tried to call an illegal event in read-only mode');
        }

        let topicDoc = {};
        topicDoc.subject = tmpl.find("#addTopicField").value;

        let aTopic = new Topic(tmpl.data.minutesId, topicDoc);

        aTopic.saveAtBottom().catch(error => {
            tmpl.find("#addTopicField").value = topicDoc.subject;
            Session.set('errorTitle', 'Validation error');
            Session.set('errorReason', error.reason);
        });
        tmpl.find("#addTopicField").value = "";
    }
});
