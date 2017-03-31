import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { InfoItem } from '/imports/infoitem';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';

let _minutesId;

Template.topicElement.onCreated(function () {
    _minutesId = Template.instance().data.minutesID;
});

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
    getInfoItem: function (index) {
        let parentTopicId = Template.instance().data.topic._id;
        let parentElement = (Template.instance().data.minutesID)
            ? Template.instance().data.minutesID : Template.instance().data.parentMeetingSeriesId;

        return {
            infoItem: this,
            parentTopicId: parentTopicId,
            isEditable: Template.instance().data.isEditable,
            minutesID: parentElement,//Template.instance().data.minutesID,
            currentCollapseId: parentTopicId+"_"+index  // each topic item gets its own collapseID
        };
    },

    // determine if this topic shall be rendered collapsed
    isCollapsed() {
        let collapseState = Session.get("minutesedit.collapsetopics."+_minutesId);
        return collapseState ? collapseState[this.topic._id] : false;
    },

    showRecurringIcon() {
        return (this.isEditable || this.topic.isRecurring);
    },

    responsiblesHelper() {
        try {
            let parentElement = (this.minutesID) ? this.minutesID : this.parentMeetingSeriesId;

            let aTopic = new Topic(parentElement, this.topic._id);
            if (aTopic.hasResponsibles()) {
                return "("+aTopic.getResponsiblesString()+")";
            }
        } catch (e) {
            // intentionally left blank.
            // on deletion of a topic blaze once calls this method on the just deleted topic
            // we handle this gracefully with this empty exception handler
        }
        return "";
    },


    classForEdit() {
        return this.isEditable ? "btnEditTopic" : "";
    },
    cursorForEdit() {
        return this.isEditable ? "pointer" : "";
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

        ConfirmationDialogFactory.makeWarningDialogWithTemplate(
            () => { aMin.removeTopic(this.topic._id) },
            'Confirm delete',
            'confirmDeleteTopic',
            {subject: this.topic.subject}
        ).show();
    },

    'click .btnToggleState'(evt) {
        evt.preventDefault();
        if (!this.minutesID) {
            return;
        }

        console.log("Toggle topic state ("+this.topic.isOpen+"): "+this.topic._id+" from minutes "+this.minutesID);
        let aTopic = new Topic(this.minutesID, this.topic._id);
        if (aTopic) {
            aTopic.toggleState();
        }
    },

    'click .js-toggle-recurring'(evt) {
        evt.preventDefault();
        if (!this.isEditable) {
            return;
        }

        if (!this.minutesID) {
            return;
        }

        let aTopic = new Topic(this.minutesID, this.topic._id);
        if (aTopic) {
            aTopic.toggleRecurring();
            aTopic.save();
        }
    },

    'click #btnEditTopic'(evt) {
        evt.preventDefault();

        if (!this.minutesID) {
            return;
        }
        if (getSelection().toString()) {    // don't fire while selection is ongoing
            return;
        }
        Session.set("topicEditTopicId", this.topic._id);
        $("#dlgAddTopic").modal("show");
    },

    'click .addTopicInfoItem'(evt) {
        evt.preventDefault();
        // will be called before the modal dialog is shown

        Session.set("topicInfoItemEditTopicId", this.topic._id);
    },

    'click #btnTopicExpandCollapse'(evt) {
        console.log("btnTopicExpandCollapse()"+this.topic._id);
        evt.preventDefault();
        let collapseState = Session.get("minutesedit.collapsetopics."+_minutesId);
        if (!collapseState) {
            collapseState = {};
        }
        collapseState[this.topic._id] = ! collapseState[this.topic._id];
        Session.set("minutesedit.collapsetopics."+_minutesId, collapseState);
    }
});