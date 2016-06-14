import { Meteor } from 'meteor/meteor';

import { Topic } from '/imports/topic'
import { Minutes } from '/imports/minutes'

Session.setDefault("topicEditTopicId", null);

let _minutesID; // the ID of these minutes

Template.topicEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
});

Template.topicEdit.onRendered(function () {
    $.material.init();
    $('#id_selResponsible').select2({
        placeholder: 'Select...',
        tags: true,
        tokenSeparators: [',', ';']
    });
});

Template.topicEdit.onDestroyed(function () {
    //add your statement here
});

var getEditTopic = function() {
    let topicId = Session.get("topicEditTopicId");

    if (_minutesID == null ||  topicId == null) {
        return false;
    }

    return new Topic(_minutesID, topicId);
};

Template.topicEdit.helpers({
    'getTopicSubject': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.subject : "";
    },

    'getTopicResponsible': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.responsible : "";
    },

    'getMinutesParticipants'() {
        let aMin = new Minutes(_minutesID);
        let participants = aMin.participants;
        for (let i in participants) {
            participants[i].username = Meteor.users.findOne(participants[i].userId).username;
        }

        // add the additional participants, by splitting string up
        let participantsAdditional = aMin.participantsAdditional;
        if (participantsAdditional) {
            let splitted = participantsAdditional.split(/[,;]/);
            for (let i in splitted) {
                let aParticipant = splitted[i].trim();
                participants.push({username: aParticipant, userId: aParticipant})
            }
        }
        return participants;
    }
});

Template.topicEdit.events({
    "click #btnTopicSave": function (evt, tmpl) {
        evt.preventDefault();

        var aSubject = tmpl.find("#id_subject").value;
        var multiResponsibles = $('#id_selResponsible').val();

        let editTopic = getEditTopic();

        let topicDoc = {};

        if (editTopic) {
            _.extend(topicDoc, editTopic._topicDoc);
        }

        topicDoc.subject = aSubject;
        topicDoc.responsibles = multiResponsibles;

        let aTopic = new Topic(_minutesID, topicDoc);
        aTopic.save((error) => {
            if (error) {
                Session.set('errorTitle', 'Validation error');
                Session.set('errorReason', error.reason);
            } else {
                $('#dlgAddTopic').modal('hide')
            }
        });
    },

    "hidden.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#frmDlgAddTopic')[0].reset();
        let subjectNode = tmpl.$("#id_subject");
        subjectNode.parent().removeClass("has-error");

        // reset the session vars to indicate that edit mode has been closed
        Session.set("topicEditTopicId", null);
    },

    "show.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#id_selResponsible').val(null).trigger("change");
    },

    "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#dlgAddTopic input').trigger("change");    // ensure new values trigger placeholder animation
        tmpl.find("#id_subject").focus();
    }
});
