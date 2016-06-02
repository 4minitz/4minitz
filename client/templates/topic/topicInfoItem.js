import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'
import { ActionItem } from '/imports/actionitem'


Template.topicInfoItem.onCreated(function () {
});

Template.topicInfoItem.onRendered(function () {
    $.material.init();
});

let detailId = 0;
Template.topicInfoItem.helpers({
    isActionItem: function() {
        return (this.infoItem.itemType === 'actionItem');
    },

    detailsArray: function () {
        // reset detailId
        detailId = 0;
        return this.infoItem.details;
    },

    detailID: function () {
        let dId = detailId;
        detailId++;
        return Math.floor(dId / 4);
    },

    topicStateClass: function () {
        if (this.infoItem.itemType !== 'actionItem') {
            return "infoitem";
        } else if (this.infoItem.isOpen) {
            return "actionitem-open";
        } else {
            return "actionitem-closed";
        }
    },

    checkedState: function () {
        if (this.infoItem.itemType === 'infoItem' || this.infoItem.isOpen) {
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
    'click #btnDelInfoItem'(evt) {
        evt.preventDefault();

        let aTopic = createTopic(this.minutesID, this.parentTopicId);
        if (aTopic) {
            aTopic.removeInfoItem(this.infoItem._id)
        }
    },

    'click #btnToggleAIState'(evt) {
        evt.preventDefault();

        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof ActionItem) {
            aInfoItem.toggleState();
            aInfoItem.save();
        }
    },

    'click #btnEditInfoItem'(evt) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }

        Session.set("topicInfoItemEditTopicId", this.parentTopicId);
        Session.set("topicInfoItemEditInfoItemId", this.infoItem._id);
    },

    'click .detailText'(evt, tmpl) {
        evt.preventDefault();

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);

        textEl.hide();


        inputEl.show();
        inputEl.val(textEl.html());
        inputEl.parent().css('margin', '0 0 0 0');
        inputEl.parent().css('vertical-align', 'baseline');
        inputEl.focus();
    },

    'change .detailInput'(evt, tmpl) {
        evt.preventDefault();

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);

        let text = inputEl.val();

        let aMin = new Minutes(tmpl.data.minutesID);
        let aTopic = new Topic(aMin, tmpl.data.parentTopicId);
        let aActionItem = new ActionItem(aTopic, tmpl.data.infoItem._id);


        let index = textEl.parent().index();

        if (text === "") {
            aActionItem._infoItemDoc.details.splice(index, 1);
        } else {
            aActionItem._infoItemDoc.details[index].text = text;
        }

        aActionItem.save();

    },

    'blur .detailInput'(evt, tmpl) {
        evt.preventDefault();

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);

        inputEl.hide();
        textEl.show();
    },

    'keyup .detailInput'(evt, tmpl) {

        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$('#detailInput_' + detailId);

        if (event.which === 13) {
            inputEl.blur();
        }
    }
});