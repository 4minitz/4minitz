import { Meteor } from 'meteor/meteor';

import { Topic } from '/imports/topic';
import { Minutes } from '/imports/minutes';
import { MeetingSeries } from '/imports/meetingseries';

import { $ } from 'meteor/jquery';

Session.setDefault("topicEditTopicId", null);

let _minutesID; // the ID of these minutes
let _meetingSeries; // ATTENTION - this var. is not reactive!

Template.topicEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
    let aMin = new Minutes(_minutesID);
    _meetingSeries = new MeetingSeries(aMin.parentMeetingSeriesID());
});

var getEditTopic = function() {
    let topicId = Session.get("topicEditTopicId");

    if (_minutesID == null ||  topicId == null) {
        return false;
    }

    return new Topic(_minutesID, topicId);
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
            buffer.push(splitted[i].trim());
        }
    }

    // add former responsibles from the parent meeting series
    if (_meetingSeries && _meetingSeries.additionalResponsibles) {
        buffer = buffer.concat(_meetingSeries.additionalResponsibles);
    }


    // add the responsibles from current topic
    let topic = getEditTopic();
    if (topic && topic.hasResponsibles()) {
        buffer = buffer.concat(topic._topicDoc.responsibles);
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
                if (aUser.profile && aUser.profile.name && aUser.profile.name !== "") {
                    aResponsibleName += " - "+aUser.profile.name;
                }
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
    console.log(participants);
    for (let i in participants) {
        if (participants[i].id && participants[i].id.length > 15) {   // Meteor _ids default to 17 chars
            participantsIds.push(participants[i].id);
        }
    }

    // format return object suiting for select2.js
    let users = Meteor.users.find({_id: {$nin: participantsIds}}).fetch();
    for (let i in users) {
        let usertext = users[i].username;
        if (users[i].profile && users[i].profile.name && users[i].profile.name !== "") {
            usertext += " - "+users[i].profile.name;
        }
        remainingUsers.push ({id: users[i]._id, text: usertext});
    }
    return remainingUsers;
};

function configureSelect2Responsibles() {
    let selectResponsibles = $('#id_selResponsible');
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
    let topic = getEditTopic();
    if (topic && topic._topicDoc && topic._topicDoc.responsibles) {
        selectResponsibles.val(topic._topicDoc.responsibles);
    }
    selectResponsibles.trigger("change");
}

Template.topicEdit.helpers({
    'getTopicSubject': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.subject : "";
    }
});

Template.topicEdit.events({
    "submit #frmDlgAddTopic": async function (evt, tmpl) {
        evt.preventDefault();
        let saveButton = $("#btnTopicSave");
        let cancelButton = $("#btnTopicCancel");
        saveButton.prop("disabled",true);
        cancelButton.prop("disabled",true);

        let editTopic = getEditTopic();
        let topicDoc = {};
        if (editTopic) {
            _.extend(topicDoc, editTopic._topicDoc);
        }

        topicDoc.subject = tmpl.find("#id_subject").value;
        topicDoc.responsibles = $('#id_selResponsible').val();

        let aTopic = new Topic(_minutesID, topicDoc);

        try {
            await aTopic.save();

            saveButton.prop("disabled",false);
            cancelButton.prop("disabled",false);
            $('#dlgAddTopic').modal('hide');
        } catch (error) {
            saveButton.prop("disabled",false);
            cancelButton.prop("disabled",false);
            Session.set('errorTitle', 'Validation error');
            Session.set('errorReason', error.reason);
        }
    },

    "hidden.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#frmDlgAddTopic')[0].reset();
        let subjectNode = tmpl.$("#id_subject");
        subjectNode.parent().removeClass("has-error");

        // reset the session vars to indicate that edit mode has been closed
        Session.set("topicEditTopicId", null);
    },

    "show.bs.modal #dlgAddTopic": function (evt, tmpl) {
        configureSelect2Responsibles();
        let saveButton = $("#btnTopicSave");
        let cancelButton = $("#btnTopicCancel");
        saveButton.prop("disabled",false);
        cancelButton.prop("disabled",false);
    },

    "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#dlgAddTopic input').trigger("change");    // ensure new values trigger placeholder animation
        tmpl.find("#id_subject").focus();
    },

    "select2:selecting #id_selResponsible"(evt, tmpl) {
        console.log("selecting:"+evt.params.args.data.id + "/"+evt.params.args.data.text);
    },

    "select2:select #id_selResponsible"(evt, tmpl) {
        console.log("select:"+evt.params.data.id + "/"+evt.params.data.text);
        let respId = evt.params.data.id;
        let respName = evt.params.data.text;
        let aUser = Meteor.users.findOne(respId);
        if (! aUser && respId == respName) {    // we have a free-text user here!
            _meetingSeries.addAdditionalResponsible(respName);
            _meetingSeries.save();
        }
    }
});
