import { Minutes } from '/imports/minutes'

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

    topicColor: function () {
        if (this.state === "open") {
            return "teal lighten-3";    // TODO: old colors
        } else {
            return "grey lighten-1";
        }
    }
});

Template.topicsList.events({
    'click #btnDelTopic'(evt, tmpl) {
        console.log("Delete Topics: "+this._id+" from minutes "+_minutesID);
        let aMin = new Minutes(_minutesID);
        aMin.removeTopicWithID(this._id);
    }
});
