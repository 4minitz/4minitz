import { Minutes } from '/imports/minutes'
import { Topic } from '/imports/topic'

Session.setDefault("topicEditMinutesId", null);
Session.setDefault("topicEditTopicId", null);

let _minutesID; // the ID of these minutes

Template.topicEdit.onCreated(function () {
    _minutesID = this.data;
    console.log("Template topicEdit created with minutesID "+_minutesID);
});

Template.topicEdit.onRendered(function () {
    this.$('#id_duedatePicker').datetimepicker(
        {
            format: "YYYY-MM-DD"
        }
    );

    $.material.init()
});

Template.topicEdit.onDestroyed(function () {
    //add your statement here
});

var getEditTopic = function() {
    let minutesId = Session.get("topicEditMinutesId");
    let topicId = Session.get("topicEditTopicId");

    if (minutesId == null ||  topicId == null) {
        return false;
    }

    return new Topic(minutesId, topicId);
};

Template.topicEdit.helpers({
    //add you helpers here
    'getTopicSubject': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.subject : "";
    },
    'getTopicPriority': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.priority : "";
    },
    'getTopicResponsible': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.responsible : "";
    },
    'getTopicDate': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.duedate : "";
    },
    'getTopicDetails': function() {
        let topic = getEditTopic();
        return (topic) ? topic.getTextFromDetails() : "";
    }
});

Template.topicEdit.events({
    "click #btnTopicSave": function (evt, tmpl) {
        evt.preventDefault();

        var aSubject = tmpl.find("#id_subject").value;
        var aPriority = tmpl.find("#id_priority").value;
        var aResponsible = tmpl.find("#id_responsible").value;
        var aDuedate = tmpl.find("#id_duedateInput").value;
        var aDetails = tmpl.find("#id_details").value;

        // validate form and show errors
        let subjectNode = tmpl.$("#id_subject");
        subjectNode.parent().removeClass("has-error");
        if (aSubject == "") {
            subjectNode.parent().addClass("has-error");
            subjectNode.focus();
            return;
        }

        let editTopic = getEditTopic();

        let aDate = (editTopic)
            ? editTopic.getDateFromDetails()
            : formatDateISO8601(new Date());

        let topicDoc = {};

        if (editTopic) {
            _.extend(topicDoc, editTopic._topicDoc);
        }

        topicDoc.subject = aSubject;
        topicDoc.responsible = aResponsible;
        topicDoc.priority = aPriority;
        topicDoc.duedate = aDuedate;
        topicDoc.details =
            [{
                date: aDate,
                text: aDetails
            }];  // end-of details

        let aTopic = new Topic(_minutesID, topicDoc);
        aTopic.save();

        // Hide modal dialog
        $('#dlgAddTopic').modal('hide')
    },

    "hidden.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#frmDlgAddTopic')[0].reset();
        let subjectNode = tmpl.$("#id_subject");
        subjectNode.parent().removeClass("has-error");

        // reset the session vars to indicate that edit mode has been closed
        Session.set("topicEditMinutesId", null);
        Session.set("topicEditTopicId", null);
    },

    "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
        if (!getEditTopic()) {
            tmpl.find("#id_duedateInput").value = currentDatePlusDeltaDays(7);
        }
        tmpl.find("#id_subject").focus();
    }
});
