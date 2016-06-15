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

    // add the responsibles from current topic
    let topic = getEditTopic();
    if (topic) {
        buffer.concat(topic._topicDoc.responsibles);
    }

    for (let i in buffer) {
        let aResponsibleId = buffer[i];
        if (! possibleResponsiblesUnique[aResponsibleId]) { // not seen?
            possibleResponsiblesUnique[aResponsibleId] = true;
            let aResponsibleName = aResponsibleId;
            let aUser = Meteor.users.findOne(aResponsibleId);
            if (aUser) {
                aResponsibleName = aUser.username;
            }
            possibleResponsibles.push({username: aResponsibleName, userId: aResponsibleId});
        }
    }

    return possibleResponsibles;
};

Template.topicEdit.helpers({
    'getTopicSubject': function() {
        let topic = getEditTopic();
        return (topic) ? topic._topicDoc.subject : "";
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
        let selectResponsibles = $('#id_selResponsible');
        selectResponsibles.val(null)        // clear <option>s and selections
            .find('option')
            .remove()
            .end();
        let possResp = getPossibleResponsibles();
        for (let i in possResp) {
            selectResponsibles.append('<option value="'+ possResp[i].userId +'">'+ possResp[i].username +'</option>');
        }

        let topic = getEditTopic();
        if (topic && topic._topicDoc && topic._topicDoc.responsibles) {
            console.log(topic._topicDoc.responsibles);
            selectResponsibles.val(topic._topicDoc.responsibles);
        }
        selectResponsibles.trigger("change");
    },

    "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
        $('#dlgAddTopic input').trigger("change");    // ensure new values trigger placeholder animation
        tmpl.find("#id_subject").focus();
    },

    "select2:selecting #id_selResponsible"(evt, tmpl) {
        // console.log(evt);
        console.log("selecting:"+evt.params.args.data.id + "/"+evt.params.args.data.text);
        // evt.preventDefault();
        // return false;
    },

    "select2:select #id_selResponsible"(evt, tmpl) {
        // console.log(evt);
        console.log("select:"+evt.params.data.id + "/"+evt.params.data.text);
    }

});
