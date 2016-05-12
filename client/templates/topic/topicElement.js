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

    getinfoItems: function () {
        let aTopic = new Topic(this.minutesID, this.topic._id);
        return aTopic.getInfoItems();
    },

    // helper will be called within the each-infoItem block
    // so this refers to the current infoItem
    getInfoItem: function () {
        return {
            topic: this,
            isEditable: this.isEditable,
            minutesID: this.minutesID,
            currentCollapseId: collapseID++  // each topic item gets its own collapseID
        };
    }
});


Template.topicElement.events({
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
        console.log(this.minutesID);
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
    },

    'click #addTopicInfoItem'(evt, tmpl) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        let newSubject = window.prompt("Please enter the subject for the new information item:","");

        let aTopic = new Topic(this.minutesID, this.topic._id);
        if (aTopic) {
            let doc = {
                subject: newSubject
            };
            let newInfoItem = new InfoItem(aTopic, doc);
            newInfoItem.save();
        }
    }
});