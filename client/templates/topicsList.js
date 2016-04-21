import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'

var _minutesID; // the ID of these minutes

Template.topicsList.onCreated(function () {
    _minutesID = this.data;
});

Template.topicsList.onRendered(function () {
});

var collapseID = 0;
Template.topicsList.helpers({
    topicsArray: function () {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return aMin.topics;
        }
        return null;
    },

    detailsArray: function () {
        return this.details;
    },

    // generate 1-1, 2-2, 3-3,... pairs to link headings with their collapsible details
    currentCollapseID: function () {
        let cID = collapseID;
        collapseID++;
        return Math.floor(cID / 2);
    },

    topicBackgroundColor: function () {
        if (this.isOpen) {
            return "panel-info";
        } else {
            return "panel-warning";
        }
    },

    openCloseIcon: function () {
        if (this.isOpen) {
            return "unchecked";
        } else {
            return "check";
        }
    }

});


Template.topicsList.events({
    'click #btnDelTopic'(evt, tmpl) {
        evt.preventDefault();
        console.log("Delete topics: "+this._id+" from minutes "+_minutesID);
        let aMin = new Minutes(_minutesID);
        aMin.removeTopic(this._id);
    },

    'click #btnToggleState'(evt, tmpl) {
        evt.preventDefault();
        console.log("Toggle topic state: "+this._id+" from minutes "+_minutesID);
        aTopic = new Topic(_minutesID, this._id);
        if (aTopic) {
            aTopic.toggleState();
            aTopic.save();
        }
    },

    'click #btnEditTopic'(evt, tmpl) {
        evt.preventDefault();
        Session.set("topicEditMinutesId", _minutesID);
        Session.set("topicEditTopicId", this._id);
    }
});
