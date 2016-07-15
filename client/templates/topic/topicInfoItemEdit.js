import { Meteor } from 'meteor/meteor';

import { Minutes } from '/imports/minutes'
import { MeetingSeries } from '/imports/meetingseries'
import { Topic } from '/imports/topic'
import { InfoItem } from '/imports/infoitem'
import { ActionItem } from '/imports/actionitem'
import { Label } from '/imports/label'

import { $ } from 'meteor/jquery';
import submitOnEnter from '../../helpers/submitOnEnter';

Session.setDefault("topicInfoItemEditTopicId", null);
Session.setDefault("topicInfoItemEditInfoItemId", null);
Session.setDefault("topicInfoItemType", "infoItem");

let _minutesID; // the ID of these minutes
let _meetingSeries; // ATTENTION - this var. is not reactive! It is cached for performance reasons!
let _emailAddressRegExp = /^[^\s@]+@([^\s@]+){2,}\.([^\s@]+){2,}$/;

Template.topicInfoItemEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
    let aMin = new Minutes(_minutesID);
    _meetingSeries = new MeetingSeries(aMin.parentMeetingSeriesID());
});

Template.topicInfoItemEdit.onRendered(function () {
    this.$('#id_item_duedatePicker').datetimepicker({
        format: "YYYY-MM-DD"
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
            configureSelect2Responsibles();
            break;
        case "infoItem":
            actionItemOnlyElements.hide();
            break;
        default:
            throw new Meteor.Error("Unknown type!");
    }
};


var getPossibleResponsibles = function() {
    let possibleResponsibles = [];          // sorted later on
    let possibleResponsiblesUnique = {};    // ensure uniqueness
    let buffer = [];                        // userIds and names from different sources, may have doubles

    // add regular participants from current minutes
    let aMin = new Minutes(_minutesID);
    for (let i in aMin.participants) {
        buffer.push(aMin.participants[i].userId);
    }

    // add the "additional participants" from current minutes as simple strings
    let participantsAdditional = aMin.participantsAdditional;
    if (participantsAdditional) {
        let splitted = participantsAdditional.split(/[,;]/);
        for (let i in splitted) {
            let partAdd = splitted[i].trim();
            if (_emailAddressRegExp.test(partAdd)) {
                buffer.push(splitted[i].trim());
            }
        }
    }

    // add former responsibles from the parent meeting series
    if (_meetingSeries && _meetingSeries.additionalResponsibles) {
        _meetingSeries.additionalResponsibles.forEach(resp => {
            if (_emailAddressRegExp.test(resp)) {
                buffer.push(resp);
            }
        });
    }

    // add the responsibles from current item
    let editItem = getEditInfoItem();
    if (editItem && editItem.hasResponsibles()) {
        buffer = buffer.concat(editItem._infoItemDoc.responsibles);
    }

    // copy buffer to possibleResponsibles
    // but take care for uniqueness
    for (let i in buffer) {
        let aResponsibleId = buffer[i];
        if (! possibleResponsiblesUnique[aResponsibleId]) { // not seen?
            possibleResponsiblesUnique[aResponsibleId] = true;
            let aResponsibleName = aResponsibleId;
            let aUser = Meteor.users.findOne(aResponsibleId);
            if (aUser) {
                aResponsibleName = aUser.username;
            }
            possibleResponsibles.push({id: aResponsibleId, text: aResponsibleName});
        }
    }

    return possibleResponsibles;
};


// get those registered users that are not already added to select2 via
// getPossibleResponsibles()
var getRemainingUsers = function (participants) {
    let participantsIds = [];
    let remainingUsers = [];
    for (let i in participants) {
        if (participants[i].id && participants[i].id.length > 15) {   // Meteor _ids default to 17 chars
            participantsIds.push(participants[i].id);
        }
    }

    // format return object suiting for select2.js
    let users = Meteor.users.find({_id: {$nin: participantsIds}}).fetch();
    for (let i in users) {
        remainingUsers.push ({id: users[i]._id, text: users[i].username});
    }
    return remainingUsers;
};


function configureSelect2Responsibles() {
    console.log("-----------ConfigureSelect2!");
    let selectResponsibles = $('#id_selResponsibleActionItem');
    selectResponsibles.find('optgroup')     // clear all <option>s
        .remove();
    let possResp = getPossibleResponsibles();
    let remainingUsers = getRemainingUsers(possResp);
    let selectOptions = [{
        text: "Participants",
        children: possResp
    }, {
        text: "Other Users",
        children: remainingUsers
    }];

    selectResponsibles.select2({
        placeholder: 'Select...',
        tags: true,                     // Allow freetext adding
        tokenSeparators: [',', ';'],
        data: selectOptions             // push <option>s data
    });

    // select the options that where stored with this topic last time
    let editItem = getEditInfoItem();
    if (editItem) {
        selectResponsibles.val(editItem.getResponsibleRawArray());
    }
    selectResponsibles.trigger("change");
}

function configureSelect2Labels() {
    let aMin = new Minutes(_minutesID);
    let aSeries = aMin.parentMeetingSeries();

    let selectLabels = $('#id_item_selLabels');
    selectLabels.find('option')     // clear all <option>s
        .remove();

    let selectOptions = [];

    aSeries.getAvailableLabels().forEach(label => {
        selectOptions.push ({id: label._id, text: label.name});
    });

    selectLabels.select2({
        placeholder: 'Select...',
        tags: true,                     // Allow freetext adding
        tokenSeparators: [',', ';'],
        data: selectOptions             // push <option>s data
    });


    // select the options that where stored with this topic last time
    let editItem = getEditInfoItem();
    if (editItem) {
        selectLabels.val(editItem.getLabelsRawArray());
    }
    selectLabels.trigger("change");
}

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
        let saveButton = $("#btnInfoItemSave");
        let cancelButton = $("#btnInfoItemCancel");
        saveButton.prop("disabled",true);
        cancelButton.prop("disabled",true);

        if (!getRelatedTopic()) {
            throw new Meteor.Error("IllegalState: We have no related topic object!");
        }

        let type = tmpl.find('input[name="id_type"]:checked').value;
        let newSubject = tmpl.find('#id_item_subject').value;

        let editItem = getEditInfoItem();
        let doc = {};
        if (editItem) {
            _.extend(doc, editItem._infoItemDoc);
        }

        let labels = tmpl.$("#id_item_selLabels").val();
        if (!labels) labels = [];
        let aMinute = new Minutes(_minutesID);
        let aSeries = aMinute.parentMeetingSeries();
        labels = labels.map(labelId => {
            let label = Label.createLabelById(aSeries, labelId);
            if (null === label) {
                // we have no such label -> it's brand new
                label = new Label({name: labelId});
                label.save(aSeries._id);
            }
            return label.getId();
        });

        doc.subject = newSubject;
        doc.createdInMinute = _minutesID;
        doc.labels = labels;

        let newItem;
        switch (type) {
            case "actionItem":
                doc.priority = tmpl.find('#id_item_priority').value;
                doc.responsibles = $('#id_selResponsibleActionItem').val();
                doc.duedate = tmpl.find('#id_item_duedateInput').value;

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

        newItem.extractLabelsFromSubject(aMinute.parentMeetingSeries());
        newItem.save((error) => {
            saveButton.prop("disabled",false);
            cancelButton.prop("disabled",false);
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
        let saveButton = $("#btnInfoItemSave");
        let cancelButton = $("#btnInfoItemCancel");
        saveButton.prop("disabled",false);
        cancelButton.prop("disabled",false);

        let editItem = getEditInfoItem();
        tmpl.find("#id_item_subject").value = (editItem) ? editItem._infoItemDoc.subject : "";

        tmpl.find('#id_item_priority').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.priority : "";

        tmpl.find('#id_item_duedateInput').value =
            (editItem && (editItem instanceof ActionItem)) ? editItem._infoItemDoc.duedate : currentDatePlusDeltaDays(7);

        // set type: edit existing item
        if (editItem) {
            let type = (editItem instanceof ActionItem) ? "actionItem" : "infoItem";
            tmpl.find('#type_' + type).checked = true;
            toggleItemMode(type, tmpl);
        } else {  // adding a new item
            configureSelect2Responsibles();
            let selectResponsibles = $('#id_selResponsibleActionItem');
            if (selectResponsibles) {
                selectResponsibles.val([]).trigger("change");
            }
            let selectLabels = $('#id_item_selLabels');
            if (selectLabels) {
                selectLabels.val([]).trigger("change");
            }
        }
    },

    "shown.bs.modal #dlgAddInfoItem": function (evt, tmpl) {
        // ensure new values trigger placeholder animation
        $('#id_item_subject').trigger("change");
        $('#id_item_priority').trigger("change");
        tmpl.find("#id_item_subject").focus();
        configureSelect2Labels();
    },

    "hidden.bs.modal #dlgAddInfoItem": function () {
        Session.set('errorTitle', null);
        Session.set('errorReason', null);

        // reset the session var to indicate that edit mode has been closed
        Session.set("topicInfoItemEditTopicId", null);
        Session.set("topicInfoItemEditInfoItemId", null);
    },

    "select2:selecting #id_selResponsibleActionItem"(evt, tmpl) {
        console.log(evt);
        console.log("selecting:"+evt.params.args.data.id + "/"+evt.params.args.data.text);
        if (evt.params.args.data.id == evt.params.args.data.text) { // we have a free-text entry
            if (! _emailAddressRegExp.test(evt.params.args.data.text)) {    // no valid mail anystring@anystring.anystring
                // prohibit non-mail free text entries
                confirmationDialog(
                    () => {},
                    "This is not a valid responsible!<br>Please select an <b>existing user</b> from the dropdown or enter a <b>valid email address</b>.",
                    "Invalid Responsible",
                    "OK",
                    "btn-info",
                    true
                );

                return false;
            }
        }
        return true;
    },

    "select2:select #id_selResponsibleActionItem"(evt, tmpl) {
        console.log("select:"+evt.params.data.id + "/"+evt.params.data.text);
        let respId = evt.params.data.id;
        let respName = evt.params.data.text;
        let aUser = Meteor.users.findOne(respId);
        if (! aUser && respId == respName &&    // we have a free-text user here!
            _emailAddressRegExp.test(respName)) { // only take valid mail addresses
            _meetingSeries.addAdditionalResponsible(respName);
            _meetingSeries.save();
        }
    }
});