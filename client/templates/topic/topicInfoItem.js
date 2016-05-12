import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'
import { ActionItem } from '/imports/actionitem'


Template.topicInfoItem.onCreated(function () {
});

Template.topicInfoItem.onRendered(function () {
    $.material.init();
});

Template.topicInfoItem.helpers({
    isActionItem: function() {
        return (this.infoItem.isOpen !== undefined);
    },

    detailsArray: function () {
        return this.infoItem.details;
    },

    topicStateClass: function () {
        if (this.infoItem.isOpen === undefined) { // it is a info item
            return "infoitem";
        } else if (this.infoItem.isOpen) {
            return "actionitem-open";
        } else {
            return "actionitem-closed";
        }
    },

    checkedState: function () {
        if (this.infoItem.isOpen) {
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

let createTopic = (minuteId, topicId) => {
    if (!minuteId || !topicId) return undefined;
    return new Topic(minuteId, topicId);
};

let findInfoItem = (minuteId, topicId, infoItemId) => {
    let aTopic = createTopic(minuteId, topicId);
    if (aTopic) {
        return aTopic.findInfoItem(infoItemId);
    }
    return undefined;
};


Template.topicInfoItem.events({
    'click #btnDelTopic'(evt, tmpl) {
        evt.preventDefault();

        let aTopic = createTopic(this.minutesID, this.parentTopicId);
        if (aTopic) {
            aTopic.removeInfoItem(this.infoItem._id)
        }
    },

    'click #btnToggleAIState'(evt, tmpl) {
        evt.preventDefault();

        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof ActionItem) {
            aInfoItem.toggleState();
            aInfoItem.save();
        }
    },

    'click #btnEditTopic'(evt, tmpl) {
        /*evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        Session.set("topicEditMinutesId", this.minutesID);
        Session.set("topicEditTopicId", this.infoItem._id);*/
    }
});