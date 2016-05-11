import { Minutes } from '/imports/minutes'

var _minutesID; // the ID of these minutes

Template.topicsList.onCreated(function () {
    _minutesID = this.data;
});

Template.topicsList.onRendered(function () {
    $.material.init();
});

var isMinuteFinalized = function () {
    let aMin = new Minutes(_minutesID);
    return (aMin && aMin.isFinalized);
};

var isModerator = function () {
    let aMin = new Minutes(_minutesID);
    return (aMin && aMin.isCurrentUserModerator());
};


var collapseID = 0;
Template.topicsList.helpers({
    topicsArray: function () {
        let aMin = new Minutes(_minutesID);
        if (aMin) {
            return aMin.topics;
        }
        return null;
    },

    getTopicItem: function () {
        return {
            topic: this,
            isEditable:  (!isMinuteFinalized() && isModerator()),
            minutesID: _minutesID,
            currentCollapseId: collapseID++  // each topic item gets its own collapseID
        };
    },

    isFinalized: function () {
        return isMinuteFinalized();
    }

});
