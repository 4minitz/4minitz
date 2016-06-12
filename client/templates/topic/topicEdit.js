import { Topic } from '/imports/topic'

Session.setDefault("topicEditTopicId", null);

let _minutesID; // the ID of these minutes

Template.topicEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
});

Template.topicEdit.onRendered(function () {
    $.material.init()
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
    }
});

Template.topicEdit.events({
    "click #btnTopicSave": async function (evt, tmpl) {
        evt.preventDefault();

        var aSubject = tmpl.find("#id_subject").value;
        var aResponsible = tmpl.find("#id_responsible").value;

        let editTopic = getEditTopic();

        let topicDoc = {};

        if (editTopic) {
            _.extend(topicDoc, editTopic._topicDoc);
        }

        topicDoc.subject = aSubject;
        topicDoc.responsible = aResponsible;

        let aTopic = new Topic(_minutesID, topicDoc);

        try {
            await aTopic.save();
            $('#dlgAddTopic').modal('hide');
        } catch (error) {
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

    "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#dlgAddTopic input').trigger("change");    // ensure new values trigger placeholder animation
        tmpl.find("#id_subject").focus();
    }
});
