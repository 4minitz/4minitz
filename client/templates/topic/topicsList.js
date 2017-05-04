import { Meteor } from 'meteor/meteor';
import { Topic } from '/imports/topic'
import { handleError } from '/client/helpers/handleError';
import { ReactiveVar } from 'meteor/reactive-var';


export class TopicListConfig {
    constructor (topics, minutesId, isReadonly, parentMeetingSeriesId) {
        this.topics = topics;
        this.minutesId = minutesId;
        this.isReadonly = isReadonly;
        this.parentMeetingSeriesId = parentMeetingSeriesId;
    }
}

Template.topicsList.onCreated(function() {
    const limited = new ReactiveVar(1);
    this.isItemsLimited = limited;
    window.onscroll = function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            limited.set(limited.get() + 1); // TODO: remove event listener if max topic count is reached
        }
    };
});

Template.topicsList.onRendered(function() {
    let scrollbarVisible = document.body.offsetHeight > window.innerHeight;
    if (scrollbarVisible) console.log('visible');
    else {
        console.log('scrollbar not visible');
        const tmpl = Template.instance();
        Meteor.defer(() => {
            tmpl.isItemsLimited.set(2); // TODO: What if two items do not require the scrollbar ?!
        });
    }
});

let collapseID = 0;
Template.topicsList.helpers({

    'getTopics': function() {
        let config =Template.instance().data;
        return config.topics.slice(0, Template.instance().isItemsLimited.get());
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
        topicDoc.responsibles = [];

        let aTopic = new Topic(tmpl.data.minutesId, topicDoc);
        aTopic.extractLabelsFromTopic(this.parentMeetingSeriesId);
        aTopic.extractResponsiblesFromTopic();

        aTopic.saveAtBottom().catch(error => {
            tmpl.find("#addTopicField").value = topicDoc.subject; // set desired value again!
            handleError(error);
        });
        tmpl.find("#addTopicField").value = "";

        // Scroll "add topic" edit field into view
        // We need a timeout here, to give meteor time to add the new topic field first
        Meteor.setTimeout(function () {
            let elem = document.getElementById("addTopicToBottomDIV");
            if (elem) {
                elem.scrollIntoView(false); // false => bottom will be aligned
            }
        }, 1);
    }
});
