/**
 * Created by felix on 12.05.16.
 */
import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'
import { InfoItem } from '/imports/infoitem'

Template.topicElement.onCreated(function () {
});

Template.topicElement.onRendered(function () {
    $.material.init();
});

let collapseID = 0;
Template.topicElement.helpers({

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
    },

    // helper will be called within the each-infoItem block
    // so this refers to the current infoItem
    getInfoItem: function () {
        let parentTopicId = Template.instance().data.topic._id;

        return {
            infoItem: this,
            parentTopicId: parentTopicId,
            isEditable: Template.instance().data.isEditable,
            minutesID: Template.instance().data.minutesID,
            currentCollapseId: collapseID++  // each topic item gets its own collapseID
        };
    },
    
    showOutline() {
        return Session.get("minutesedit.showOutline");
    }
});


Template.topicElement.events({
    'click #btnDelTopic'(evt) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        console.log("Delete topics: "+this.topic._id+" from minutes "+this.minutesID);
        let aMin = new Minutes(this.minutesID);
        aMin.removeTopic(this.topic._id);
    },

    'click #btnToggleState'(evt) {
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

    'click #btnEditTopic'(evt) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        Session.set("topicEditTopicId", this.topic._id);
    },

    'click .addTopicInfoItem'(evt) {
        evt.preventDefault();
        // will be called before the modal dialog is shown

        Session.set("topicInfoItemEditTopicId", this.topic._id);
    }
});