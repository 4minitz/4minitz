import { ReactiveVar } from 'meteor/reactive-var'

import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'
import { InfoItemFactory } from '/imports/InfoItemFactory'
import { ActionItem } from '/imports/actionitem'
import { InfoItem } from '/imports/infoitem'

Template.topicInfoItem.onCreated(function () {
    this.isTopicCollapsed = new ReactiveVar(true);
});

let getMeetingSeriesId = (parentElementId) => {
    let aMin = Minutes.findOne(parentElementId);
    if (aMin) {
        return aMin.parentMeetingSeriesID();
    } else {
        return parentElementId;
    }
};

let createTopic = (parentElementId, topicId) => {
    if (!parentElementId || !topicId) return undefined;
    return new Topic(parentElementId, topicId);
};

let findInfoItem = (parentElementId, topicId, infoItemId) => {
    let aTopic = createTopic(parentElementId, topicId);
    if (aTopic) {
        return aTopic.findInfoItem(infoItemId);
    }
    return undefined;
};

let resizeTextarea = (element) => {
    let scrollPos = $(document).scrollTop();
    element.css('height', 'auto');
    element.css('height', element.prop('scrollHeight') + "px");
    $(document).scrollTop(scrollPos);
};


Template.topicInfoItem.helpers({
    isActionItem: function() {
        return (this.infoItem.itemType === 'actionItem');
    },

    detailsArray: function () {
        return (this.infoItem.details) ? this.infoItem.details : [];
    },

    getLabels: function() {
        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        return aInfoItem.getLabels(getMeetingSeriesId(this.minutesID))
            .map(labelObj => {
                let doc = labelObj.getDocument();
                doc.fontColor = labelObj.hasDarkBackground() ? '#ffffff' : '#000000';

                return doc;
            });
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
    },

    isCollapsed() {
        console.log("_coll "+Template.instance().isTopicCollapsed.get());
        return Template.instance().isTopicCollapsed.get();
    },

    showPinItem() {
        return (this.infoItem.itemType === 'infoItem' && ( this.isEditable || this.infoItem.isSticky) );
    },

    responsiblesHelper() {
        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof ActionItem) {
            if (aInfoItem.hasResponsibles()) {
                return "(" + aInfoItem.getResponsibleNameString() + ")";
            }
        }
        return "";
    }
});



Template.topicInfoItem.events({
    'click #btnDelInfoItem'(evt) {
        evt.preventDefault();

        let aTopic = createTopic(this.minutesID, this.parentTopicId);
        if (aTopic) {
            let itemType = (this.infoItem.itemType === "infoItem") ? "information" : "action item";
            let dialogContent = "<p>Do you really want to delete the " + itemType + " <strong>" + this.infoItem.subject + "</strong>?</p>";

            confirmationDialog(
                /* callback called if user wants to continue */
                () => {
                    aTopic.removeInfoItem(this.infoItem._id)
                },
                /* Dialog content */
                dialogContent
            );
        }
    },

    'click .btnToggleAIState'(evt) {
        evt.preventDefault();

        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof ActionItem) {
            aInfoItem.toggleState();
            aInfoItem.save();
        }
    },

    'click .btnPinInfoItem'(evt) {
        evt.preventDefault();

        if (!this.isEditable) {
            return;
        }

        let aInfoItem = findInfoItem(this.minutesID, this.parentTopicId, this.infoItem._id);
        if (aInfoItem instanceof InfoItem) {
            aInfoItem.toggleSticky();
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
        console.log(tmpl.data.currentCollapseId);

        if (!tmpl.data.isEditable) {
            return;
        }

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);

        if (inputEl.val() !== "") {
            return;
        }

        textEl.hide();
        inputEl.show();
        inputEl.val(textEl.attr('data-text'));
        inputEl.parent().css('margin', '0 0 25px 0');
        inputEl.focus();
        resizeTextarea(inputEl);
    },

    'click .addDetail'(evt, tmpl) {
        tmpl.$('#collapse-' + this.currentCollapseId).collapse('show');

        let aMin = new Minutes(tmpl.data.minutesID);
        let aTopic = new Topic(aMin, tmpl.data.parentTopicId);
        let aActionItem = InfoItemFactory.createInfoItem(aTopic, tmpl.data.infoItem._id);


        aActionItem.addDetails();
        aActionItem.save();
        // We need this forked to re-create material input fields
        Meteor.setTimeout(function () {
            let inputEl = tmpl.$('.detailRow').find('.detailInput').last().show();
            inputEl.parent().css('margin', '0 0 25px 0');
            inputEl.show();
            inputEl.focus();
        }, 0);

    },

    'blur .detailInput'(evt, tmpl) {
        evt.preventDefault();

        let detailId = evt.currentTarget.getAttribute('data-id');
        let textEl = tmpl.$('#detailText_' + detailId);
        let inputEl = tmpl.$('#detailInput_' + detailId);

        let text = inputEl.val();

        let detailsCount = undefined;
        if (text === "" || (text !== textEl.attr('data-text'))) {
            let aMin = new Minutes(tmpl.data.minutesID);
            let aTopic = new Topic(aMin, tmpl.data.parentTopicId);
            let aActionItem = InfoItemFactory.createInfoItem(aTopic, tmpl.data.infoItem._id);
            let index = detailId.split('_')[2]; // detail id is: <collapseId>_<index>
            aActionItem.updateDetails(index, text.trim());
            aActionItem.save();
            detailsCount = aActionItem.getDetails().length;
        }

        inputEl.val("");
        inputEl.hide();
        textEl.show();

        if (detailsCount === 0) {
            tmpl.$('#collapse-' + tmpl.data.currentCollapseId).collapse('hide');
        }
    },

    'keypress .detailInput'(evt, tmpl) {
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$('#detailInput_' + detailId);
        if (event.which === 13/*enter*/ && event.ctrlKey) {
            evt.preventDefault();
            inputEl.blur();
        }

        resizeTextarea(inputEl);
    },

    'keyup .detailInput'(evt, tmpl) {
        let detailId = evt.currentTarget.getAttribute('data-id');
        let inputEl = tmpl.$('#detailInput_' + detailId);

        // escape key will not be handled in keypress callback...
        if (event.which === 27/*escape*/) {
            evt.preventDefault();
            inputEl.blur();
        }

        resizeTextarea(inputEl);
    },

    "hide.bs.collapse"(evt, tmpl) {
        tmpl.isTopicCollapsed.set(true);
    },
    "show.bs.collapse"(evt, tmpl) {
        tmpl.isTopicCollapsed.set(false);
    }

});
