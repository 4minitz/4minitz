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
  console.log(`Template topicEdit created with minutesID ${_minutesID}`);
  const aMin = new Minutes(_minutesID);
  _meetingSeries = new MeetingSeries(aMin.parentMeetingSeriesID());
});

const getEditTopic = () => {
  const topicId = Session.get("topicEditTopicId");

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
  getTopicSubject() {
    const topic = getEditTopic();
    return topic ? topic._topicDoc.subject : "";
  },
});

Template.topicEdit.events({
  "submit #frmDlgAddTopic": async function (evt, tmpl) {
    const saveButton = $("#btnTopicSave");

    try {
      saveButton.prop("disabled", true);

      evt.preventDefault();

      const editTopic = getEditTopic();
      const topicDoc = {};
      if (editTopic) {
        _.extend(topicDoc, editTopic._topicDoc);
      }

      let labels = tmpl.$("#id_item_selLabels").val();
      if (!labels) labels = [];
      const aMinute = new Minutes(_minutesID);
      const aSeries = aMinute.parentMeetingSeries();
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
    const subjectNode = tmpl.$("#id_subject");
    subjectNode.parent().removeClass("has-error");

    // reset the session vars to indicate that edit mode has been closed
    Session.set("topicEditTopicId", null);
  },

  "show.bs.modal #dlgAddTopic": function (evt) {
    const topic = getEditTopic();

    if (topic !== false) {
      const element = topic._topicDoc;
      const unset = () => {
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
    const selectLabels = $("#id_item_selLabels");
    if (selectLabels) {
      selectLabels.val([]).trigger("change");
    }
    configureSelect2Labels(_minutesID, "#id_item_selLabels", getEditTopic());
    const saveButton = $("#btnTopicSave");
    const cancelButton = $("#btnTopicCancel");
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

  keyup(evt) {
    evt.preventDefault();
    if (evt.keyCode === 27) {
      closePopupAndUnsetIsEdited();
    }
  },

  "select2:select #id_selResponsible"(evt) {
    const respId = evt.params.data.id;
    const respName = evt.params.data.text;
    const aUser = Meteor.users.findOne(respId);
    if (!aUser && respId === respName) {
      // we have a free-text user here!
      _meetingSeries.addAdditionalResponsible(respName);
      _meetingSeries.save();
    }
  },
});
