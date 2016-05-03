import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'


Template.topicItem.onCreated(function () {
});

Template.topicItem.onRendered(function () {
});

Template.topicItem.helpers({
    detailsArray: function () {
        return this.topic.details;
    },

    topicStateClass: function () {
        if (this.topic.isOpen) {
            return "actionitem-open";
        } else {
            return "actionitem-closed";
        }
    },

    checkedState: function () {
        if (this.topic.isOpen) {
            return "";
        } else {
            return {checked: "checked"};
        }
    },

    disabledState: function () {
        if (this.isEditable) {
            return "";
        } else {
            return {disabled: "disabled"};
        }
    }

});


Template.topicItem.events({
    'click #btnDelTopic'(evt, tmpl) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        console.log("Delete topics: "+this.topic._id+" from minutes "+this.minutesID);
        let aMin = new Minutes(this.minutesID);
        aMin.removeTopic(this.topic._id);
    },

    'click #btnToggleState'(evt, tmpl) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        console.log("Toggle topic state ("+this.topic.isOpen+"): "+this.topic._id+" from minutes "+this.minutesID);
        let aTopic = new Topic(this.minutesID, this.topic._id);
        if (aTopic) {
            aTopic.toggleState();
            aTopic.save();
        }
    },

    'click #btnEditTopic'(evt, tmpl) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        Session.set("topicEditMinutesId", this.minutesID);
        Session.set("topicEditTopicId", this.topic._id);
    }
});