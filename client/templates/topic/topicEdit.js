import { handleError } from "/client/helpers/handleError";
import { convertOrCreateLabelsFromStrings } from "/client/templates/topic/helpers/convert-or-create-label-from-string";
import { configureSelect2Responsibles } from "/imports/client/ResponsibleSearch";
import { MeetingSeries } from "/imports/meetingseries";
import { Minutes } from "/imports/minutes";
import { Topic } from "/imports/topic";
import { _ } from "lodash";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

import { IsEditedService } from "../../../imports/services/isEditedService";
import { isEditedHandling } from "../../helpers/isEditedHelpers";

import { configureSelect2Labels } from "./helpers/configure-select2-labels";
import { createTopic } from "./helpers/create-topic";

Session.setDefault("topicEditTopicId", null);

let _minutesID; // the ID of these minutes
let _meetingSeries; // ATTENTION - this var. is not reactive!

Template.topicEdit.onCreated(function () {
  _minutesID = this.data;
  console.log("Template topicEdit created with minutesID " + _minutesID);
  let aMin = new Minutes(_minutesID);
  _meetingSeries = new MeetingSeries(aMin.parentMeetingSeriesID());
});

let getEditTopic = function () {
  let topicId = Session.get("topicEditTopicId");

  if (_minutesID === null || topicId === null) {
    return false;
  }

  return new Topic(_minutesID, topicId);
};

function closePopupAndUnsetIsEdited() {
  const topic = getEditTopic();
  if (typeof topic !== "undefined") {
    IsEditedService.removeIsEditedTopic(_minutesID, topic._topicDoc._id, false);
  }

  $("#dlgAddTopic").modal("hide");
}

Template.topicEdit.helpers({
  getTopicSubject: function () {
    let topic = getEditTopic();
    return topic ? topic._topicDoc.subject : "";
  },
});

Template.topicEdit.events({
  "submit #frmDlgAddTopic": async function (evt, tmpl) {
    let saveButton = $("#btnTopicSave");

    try {
      saveButton.prop("disabled", true);

      evt.preventDefault();

      let editTopic = getEditTopic();
      let topicDoc = {};
      if (editTopic) {
        _.extend(topicDoc, editTopic._topicDoc);
      }

      let labels = tmpl.$("#id_item_selLabels").val();
      if (!labels) labels = [];
      let aMinute = new Minutes(_minutesID);
      let aSeries = aMinute.parentMeetingSeries();
      labels = convertOrCreateLabelsFromStrings(labels, aSeries);

      topicDoc.subject = tmpl.find("#id_subject").value;
      topicDoc.responsibles = $("#id_selResponsible").val();
      topicDoc.labels = labels;
      topicDoc.isEditedBy = null; // We don't use the IsEditedService here...
      topicDoc.isEditedDate = null; // ... as this would save the topic twice to
      // the DB. And it provokes Issue #379

      const aTopic = createTopic(_minutesID, aSeries._id, topicDoc);
      aTopic.save().catch(handleError);
      $("#dlgAddTopic").modal("hide");
    } finally {
      saveButton.prop("disabled", false);
    }
  },

  "hidden.bs.modal #dlgAddTopic": function (evt, tmpl) {
    $("#frmDlgAddTopic")[0].reset();
    let subjectNode = tmpl.$("#id_subject");
    subjectNode.parent().removeClass("has-error");

    // reset the session vars to indicate that edit mode has been closed
    Session.set("topicEditTopicId", null);
  },

  "show.bs.modal #dlgAddTopic": function (evt) {
    let topic = getEditTopic();

    if (topic !== false) {
      const element = topic._topicDoc;
      const unset = function () {
        IsEditedService.removeIsEditedTopic(
          _minutesID,
          topic._topicDoc._id,
          true,
        );
        $("#dlgAddTopic").modal("show");
      };
      const setIsEdited = () => {
        IsEditedService.setIsEditedTopic(_minutesID, topic._topicDoc._id);
      };

      isEditedHandling(
        element,
        unset,
        setIsEdited,
        evt,
        "confirmationDialogResetEdit",
      );
    }

    configureSelect2Responsibles(
      "id_selResponsible",
      topic._topicDoc,
      false,
      _minutesID,
      topic,
    );
    let selectLabels = $("#id_item_selLabels");
    if (selectLabels) {
      selectLabels.val([]).trigger("change");
    }
    configureSelect2Labels(_minutesID, "#id_item_selLabels", getEditTopic());
    let saveButton = $("#btnTopicSave");
    let cancelButton = $("#btnTopicCancel");
    saveButton.prop("disabled", false);
    cancelButton.prop("disabled", false);
  },

  "shown.bs.modal #dlgAddTopic": function (evt, tmpl) {
    $("#dlgAddTopic").find("input").trigger("change"); // ensure new values trigger placeholder animation
    tmpl.find("#id_subject").focus();
  },

  "click #btnTopicCancel": function (evt) {
    evt.preventDefault();

    closePopupAndUnsetIsEdited();
  },

  "click .close": function (evt) {
    evt.preventDefault();

    closePopupAndUnsetIsEdited();
  },

  keyup: function (evt) {
    evt.preventDefault();
    if (evt.keyCode === 27) {
      closePopupAndUnsetIsEdited();
    }
  },

  "select2:select #id_selResponsible"(evt) {
    let respId = evt.params.data.id;
    let respName = evt.params.data.text;
    let aUser = Meteor.users.findOne(respId);
    if (!aUser && respId === respName) {
      // we have a free-text user here!
      _meetingSeries.addAdditionalResponsible(respName);
      _meetingSeries.save();
    }
  },
});
