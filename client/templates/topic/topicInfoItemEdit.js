import { Topic } from '/imports/topic';
import { InfoItem } from '/imports/infoitem';
import { ActionItem } from '/imports/actionitem';

import { $ } from 'meteor/jquery';
import submitOnEnter from '../../helpers/submitOnEnter';

Session.setDefault("topicInfoItemEditTopicId", null);
Session.setDefault("topicInfoItemEditInfoItemId", null);
Session.setDefault("topicInfoItemType", "infoItem");

let _minutesID; // the ID of these minutes

Template.topicInfoItemEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
});

Template.topicInfoItemEdit.onRendered(function () {
    this.$('#id_item_duedatePicker').datetimepicker({
        format: "YYYY-MM-DD"
    });

    $.material.init();

    let textarea = ['#id_item_details'];

    submitOnEnter(textarea, () => {
        $('#frmDlgAddInfoItem').submit();
    });
});

let getRelatedTopic = function() {
    let minutesId = _minutesID;
    let topicId = Session.get("topicInfoItemEditTopicId");

    if (minutesId == null ||  topicId == null) {
        return false;
    }

    return new Topic(minutesId, topicId);
};

let getEditInfoItem = function() {
    let id = Session.get("topicInfoItemEditInfoItemId");

    if (!id) return false;

    return getRelatedTopic().findInfoItem(id);
};

let toggleItemMode = function (type, tmpl) {
    let actionItemOnlyElements = tmpl.$('.actionItemOnly');
    Session.set("topicInfoItemType", type);
    switch (type) {
        case "actionItem":
            actionItemOnlyElements.show();
            break;
        case "infoItem":
            actionItemOnlyElements.hide();
            break;
        default:
            throw new Meteor.Error("Unknown type!");
    }
};

Template.topicInfoItemEdit.helpers({
    isEditMode: function () {
        return (getEditInfoItem() !== false);
    },

    disableTypeChange: function () {
        return (getEditInfoItem()) ? "disabled" : "";
    },

    getTopicSubject: function () {
        let topic = getRelatedTopic();
        return (topic) ? topic._topicDoc.subject : "";
    },

    getTopicItemType: function () {
        let type = Session.get("topicInfoItemType");
        return (type === "infoItem") ? "Information" : "Action Item";
    }
});

Template.topicInfoItemEdit.events({
    'click .type': function(evt, tmpl) {
        let type = evt.target.value;
        toggleItemMode(type, tmpl);
        tmpl.find("#id_item_subject").focus();
    },

    'submit #frmDlgAddInfoItem': function(evt, tmpl) {
        evt.preventDefault();

        if (!getRelatedTopic()) {
            throw new Meteor.Error("IllegalState: We have no related topic object!");
        }

        let editItem = getEditInfoItem();

        let type = tmpl.find('input[name="id_type"]:checked').value;
        let newSubject = tmpl.find('#id_item_subject').value;

        let doc = {};

        if (editItem) {
            _.extend(doc, editItem._infoItemDoc);
        }

        doc.subject = newSubject;
        doc.createdInMinute = _minutesID;

        let newItem;
        switch (type) {
            case "actionItem":
                let detailsDate = (editItem) ? editItem.getDateFromDetails() : formatDateISO8601(new Date());

                doc.priority = tmpl.find('#id_item_priority').value;
                doc.responsible = tmpl.find('#id_item_responsible').value;
                doc.duedate = tmpl.find('#id_item_duedateInput').value;

                let detailsText = tmpl.find('#id_item_details');
                if (detailsText && detailsText.value) {
                    detailsText = detailsText.value;
                    if (doc.details && doc.details.length > 0) {
                        doc.details[0].text = detailsText;
                    } else {
                        doc.details = [
                            {
                                date: detailsDate,
                                text: detailsText
                            }
                        ];
                    }
                } else {
                    doc.details = (!doc.details) ? [] : doc.details;
                }
                newItem = new ActionItem(getRelatedTopic(), doc);
                break;
            case "infoItem":
            {
                newItem = new InfoItem(getRelatedTopic(), doc);
                break;
            }
            default:
                throw new Meteor.Error("Unknown type!");
        }

        newItem.save((error) => {
            if (error) {
                Session.set('errorTitle', 'Validation error');
                Session.set('errorReason', error.reason);
            } else {
                $('#dlgAddInfoItem').modal('hide')
            }
        });
    },

    "show.bs.modal #dlgAddInfoItem": function (evt, tmpl) {
        // will be called before the dialog is shown
        // at this point we clear the view
        let editItem = getEditInfoItem();
        tmpl.find("#id_item_subject").value = (editItem) ? editItem._infoItemDoc.subject : "";

        tmpl.find('#id_item_priority').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.priority : "";
        tmpl.find('#id_item_responsible').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.responsible : "";
        tmpl.find('#id_item_duedateInput').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.duedate : currentDatePlusDeltaDays(7);
        let detailsField = tmpl.find('#id_item_details');
        if (detailsField) {
            detailsField.value =
                (editItem && (editItem instanceof ActionItem)) ? editItem.getTextFromDetails() : "";
        }

        // set type
        if (editItem) {
            let type = (editItem instanceof ActionItem) ? "actionItem" : "infoItem";
            tmpl.find('#type_' + type).checked = true;
            toggleItemMode(type, tmpl);
        }
    },

    "shown.bs.modal #dlgAddInfoItem": function (evt, tmpl) {
        // ensure new values trigger placeholder animation
        $('#id_item_priority').trigger("change");
        $('#id_item_responsible').trigger("change");
        $('#id_item_details').trigger("change");
        tmpl.find("#id_item_subject").focus();
    },

    "hidden.bs.modal #dlgAddInfoItem": function () {
        Session.set('errorTitle', null);
        Session.set('errorReason', null);

        // reset the session var to indicate that edit mode has been closed
        Session.set("topicInfoItemEditTopicId", null);
        Session.set("topicInfoItemEditInfoItemId", null);
    }
});