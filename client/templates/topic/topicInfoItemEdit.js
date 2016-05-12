/**
 * Created by felix on 12.05.16.
 */
import { Topic } from '/imports/topic'
import { InfoItem } from '/imports/infoitem'
import { ActionItem } from '/imports/actionitem'

Session.setDefault("topicInfoItemEditTopicId", null);
Session.setDefault("topicInfoItemEditInfoItemId", null);

let _minutesID; // the ID of these minutes

Template.topicInfoItemEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
});

Template.topicInfoItemEdit.onRendered(function () {
    this.$('#id_item_duedatePicker').datetimepicker(
        {
            format: "YYYY-MM-DD"
        }
    );

    $.material.init()
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

Template.topicInfoItemEdit.helpers({
    isEditMode: function () {
        return false;
    },

    getTopicSubject: function () {
        let topic = getRelatedTopic();
        return (topic) ? topic._topicDoc.subject : "";
    }
});

Template.topicInfoItemEdit.events({
    'change #id_type': function(evt, tmpl) {
        let type = evt.target.value;
        let actionItemOnlyElements = tmpl.$('.actionItemOnly');
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
    },

    'click #btnInfoItemSave': function(evt, tmpl) {
        evt.preventDefault();

        if (!getRelatedTopic()) {
            throw new Meteor.Error("IllegalState: We have no related topic object!");
        }

        let type = tmpl.find('#id_type').value;
        let newSubject = tmpl.find('#id_item_subject').value;

        let doc = {
            subject: newSubject
        };

        let newItem;
        switch (type) {
            case "actionItem":
                doc.priority = tmpl.find('#id_item_priority').value;
                doc.responsible = tmpl.find('#id_item_responsible').value;
                doc.duedate = tmpl.find('#id_item_duedateInput').value;
                doc.details = [
                    {
                        date: new Date(),
                        text: tmpl.find('#id_item_details').value
                    }
                ];
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

        newItem.save();
        $('#dlgAddInfoItem').modal('hide')
    },

    "show.bs.modal #dlgAddInfoItem": function (evt, tmpl) {
        // will be called before the dialog is shown
        // at this point we clear the view
        let editItem = getEditInfoItem();
        tmpl.find("#id_item_subject").value = (editItem) ? editItem._infoItemDoc.subject : "";
        tmpl.find('#id_item_priority').value = "";
        tmpl.find('#id_item_responsible').value = "";
        tmpl.find('#id_item_duedateInput').value = "";
        tmpl.find('#id_item_details').value = "";
        tmpl.find("#id_item_duedateInput").value = currentDatePlusDeltaDays(7);
    },

    "shown.bs.modal #dlgAddInfoItem": function (evt, tmpl) {
        //if (!getEditTopic()) {
            tmpl.find("#id_item_duedateInput").value = currentDatePlusDeltaDays(7);
        //}
        tmpl.find("#id_item_subject").focus();
    }
});