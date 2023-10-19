import { handleError } from "/client/helpers/handleError";
import { ActionItem } from "/imports/actionitem";
import { configureSelect2Responsibles } from "/imports/client/ResponsibleSearch";
import { currentDatePlusDeltaDays } from "/imports/helpers/date";
import { MeetingSeries } from "/imports/meetingseries";
import { Minutes } from "/imports/minutes";
import { Priority } from "/imports/priority";
import { Topic } from "/imports/topic";
import { User, userSettings } from "/imports/user";
import { _ } from "lodash";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";
import moment from "moment/moment";
import isEmail from "validator/lib/isEmail";

import { IsEditedService } from "../../../imports/services/isEditedService";
import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";
import { isEditedHandling } from "../../helpers/isEditedHelpers";

import { configureSelect2Labels } from "./helpers/configure-select2-labels";
import { createItem } from "./helpers/create-item";
import { handlerShowMarkdownHint } from "./helpers/handler-show-markdown-hint";

Session.setDefault("topicInfoItemEditTopicId", null);
Session.setDefault("topicInfoItemEditInfoItemId", null);
Session.setDefault("topicInfoItemType", "infoItem");

let _minutesID; // the ID of these minutes
let _meetingSeries; // ATTENTION - this var. is not reactive! It is cached for
// performance reasons!

Template.topicInfoItemEdit.onCreated(function () {
  _minutesID = this.data;
  console.log(`Template topicEdit created with minutesID ${_minutesID}`);
  const aMin = new Minutes(_minutesID);
  _meetingSeries = new MeetingSeries(aMin.parentMeetingSeriesID());

  const user = new User();
  this.collapseState = new ReactiveVar(
    user.getSetting(userSettings.showAddDetail, true),
  );
});

Template.topicInfoItemEdit.onRendered(function () {
  // Configure DateTimePicker
  moment.locale("en", {
    week: { dow: 1 }, // Monday is the first day of the week
  });
  // see http://eonasdan.github.io/bootstrap-datetimepicker/Options/
  this.$("#id_item_duedatePicker").datetimepicker({
    format: "YYYY-MM-DD",
    // calendarWeeks: true, // unfortunately this leads to "NaN" weeks on some
    // systems...
    showTodayButton: true,
  });
});

const getRelatedTopic = () => {
  const minutesId = _minutesID;
  const topicId = Session.get("topicInfoItemEditTopicId");

  if (minutesId === null || topicId === null) {
    return false;
  }

  return new Topic(minutesId, topicId);
};

const getEditInfoItem = () => {
  const id = Session.get("topicInfoItemEditInfoItemId");

  if (!id) return false;

  return getRelatedTopic().findInfoItem(id);
};

const toggleItemMode = (type, tmpl) => {
  const actionItemOnlyElements = tmpl.$(".actionItemOnly");
  Session.set("topicInfoItemType", type);
  const editItem = getEditInfoItem();
  const freeTextValidator = (text) => {
    return isEmail(text);
  };
  switch (type) {
    case "actionItem":
      actionItemOnlyElements.show();
      configureSelect2Responsibles(
        "id_selResponsibleActionItem",
        editItem._infoItemDoc,
        freeTextValidator,
        _minutesID,
        editItem,
      );
      break;
    case "infoItem":
      actionItemOnlyElements.hide();
      break;
    default:
      Session.set("topicInfoItemType", null);
      throw new Meteor.Error("Unknown type!");
  }
};

const resizeTextarea = (element) => {
  const newLineRegEx = new RegExp(/\n/g);
  const textAreaValue = element.val();
  const occurrences = (textAreaValue.match(newLineRegEx) || []).length;

  // limit of textarea size
  if (occurrences < 15) {
    if (occurrences === 0) element.attr("rows", occurrences + 2);
    else element.attr("rows", occurrences + 1);
  }
};

function closePopupAndUnsetIsEdited() {
  IsEditedService.removeIsEditedInfoItem(
    _minutesID,
    Session.get("topicInfoItemEditTopicId"),
    Session.get("topicInfoItemEditInfoItemId"),
    false,
  );

  $("#dlgAddInfoItem").modal("hide");
}

Template.topicInfoItemEdit.helpers({
  getPriorities() {
    return Priority.GET_PRIORITIES();
  },
  isEditMode() {
    return getEditInfoItem() !== false;
  },

  getTopicSubject() {
    const topic = getRelatedTopic();
    return topic ? topic._topicDoc.subject : "";
  },

  getTopicItemType() {
    const type = Session.get("topicInfoItemType");
    return type === "infoItem"
      ? i18n.__("Item.editItemModelTypeInfoItem")
      : i18n.__("Item.editItemModelTypeActionItem");
  },

  collapseState() {
    const user = new User();
    return user.getSetting(userSettings.showAddDetail, true);
  },
});

Template.topicInfoItemEdit.events({
  "submit #frmDlgAddInfoItem": async function (evt, tmpl) {
    const saveButton = $("#btnInfoItemSave");

    try {
      saveButton.prop("disabled", true);

      evt.preventDefault();

      if (!getRelatedTopic()) {
        throw new Meteor.Error(
          "IllegalState: We have no related topic object!",
        );
      }
      if (Session.get("topicInfoItemEditInfoItemId") !== null)
        IsEditedService.removeIsEditedInfoItem(
          _minutesID,
          Session.get("topicInfoItemEditTopicId"),
          Session.get("topicInfoItemEditInfoItemId"),
          true,
        );
      const editItem = getEditInfoItem();

      const type = Session.get("topicInfoItemType");
      const newSubject = tmpl.find("#id_item_subject").value;
      const newDetail = editItem
        ? false
        : tmpl.find("#id_item_detailInput").value;
      const labels = tmpl.$("#id_item_selLabelsActionItem").val();

      const doc = {};
      if (editItem) {
        _.extend(doc, editItem._infoItemDoc);
      }

      doc.subject = newSubject;

      if (type === "actionItem") {
        doc.responsibles = $("#id_selResponsibleActionItem").val();
        doc.duedate = tmpl.find("#id_item_duedateInput").value;
        doc.priority = tmpl.find("#id_item_priority").value;
      }

      const minutes = new Minutes(_minutesID);
      const newItem = createItem(
        doc,
        getRelatedTopic(),
        _minutesID,
        minutes.parentMeetingSeries(),
        type,
        labels,
      );

      if (newDetail) {
        newItem.addDetails(minutes._id, newDetail);
      }

      newItem.saveAsync().catch(handleError);
      $("#dlgAddInfoItem").modal("hide");
    } finally {
      saveButton.prop("disabled", false);
    }
  },

  // will be called before the dialog is shown
  "show.bs.modal #dlgAddInfoItem": function (evt, tmpl) {
    // at this point we clear the view
    const saveButton = $("#btnInfoItemSave");
    const cancelButton = $("#btnInfoItemCancel");
    saveButton.prop("disabled", false);
    cancelButton.prop("disabled", false);

    const editItem = getEditInfoItem();

    const itemSubject = tmpl.find("#id_item_subject");
    itemSubject.value = editItem ? editItem._infoItemDoc.subject : "";

    tmpl.find("#id_item_priority").value =
      editItem && editItem instanceof ActionItem
        ? editItem._infoItemDoc.priority
        : Priority.GET_DEFAULT_PRIORITY().value;

    tmpl.find("#id_item_duedateInput").value =
      editItem && editItem instanceof ActionItem
        ? editItem._infoItemDoc.duedate
        : currentDatePlusDeltaDays(7);

    const user = new User();
    tmpl.collapseState.set(user.getSetting(userSettings.showAddDetail, true));

    const detailsArea = tmpl.find("#id_item_detailInput");
    if (detailsArea) {
      detailsArea.value = "";
      detailsArea.setAttribute("rows", 2);
      if (tmpl.collapseState.get() === false) {
        detailsArea.style.display = "none";
      }
    }

    configureSelect2Labels(
      _minutesID,
      "#id_item_selLabelsActionItem",
      getEditInfoItem(),
    );
    // set type: edit existing item
    if (editItem) {
      const type = editItem instanceof ActionItem ? "actionItem" : "infoItem";
      toggleItemMode(type, tmpl);

      const element = editItem._infoItemDoc;
      const unset = () => {
        IsEditedService.removeIsEditedInfoItem(
          _minutesID,
          Session.get("topicInfoItemEditTopicId"),
          Session.get("topicInfoItemEditInfoItemId"),
          true,
        );
        $("#dlgAddInfoItem").modal("show");
      };
      const setIsEdited = () => {
        IsEditedService.setIsEditedInfoItem(
          _minutesID,
          Session.get("topicInfoItemEditTopicId"),
          Session.get("topicInfoItemEditInfoItemId"),
        );
      };

      isEditedHandling(
        element,
        unset,
        setIsEdited,
        evt,
        "confirmationDialogResetEdit",
      );
    } else {
      // adding a new item
      const freeTextValidator = (text) => {
        return isEmail(text);
      };
      const editItem = getEditInfoItem();
      configureSelect2Responsibles(
        "id_selResponsibleActionItem",
        editItem._infoItemDoc,
        freeTextValidator,
        _minutesID,
        editItem,
      );
      const selectResponsibles = $("#id_selResponsibleActionItem");
      if (selectResponsibles) {
        selectResponsibles.val([]).trigger("change");
      }
      const selectLabels = $("#id_item_selLabelsActionItem");
      if (selectLabels) {
        selectLabels.val([]).trigger("change");
      }
      const infoItemType = Session.get("topicInfoItemType");
      toggleItemMode(infoItemType, tmpl);

      itemSubject.value = infoItemType === "infoItem" ? "Info" : "";
    }
  },

  "shown.bs.modal #dlgAddInfoItem": function (evt, tmpl) {
    // ensure new values trigger placeholder animation
    $("#id_item_subject").trigger("change");
    $("#id_item_priority").trigger("change");
    const itemSubject = tmpl.find("#id_item_subject");
    itemSubject.focus();
    itemSubject.select();
  },

  "hidden.bs.modal #dlgAddInfoItem": function () {
    // reset the session var to indicate that edit mode has been closed
    Session.set("topicInfoItemEditTopicId", null);
    Session.set("topicInfoItemEditInfoItemId", null);
    Session.set("topicInfoItemType", null);
  },

  "select2:selecting #id_selResponsibleActionItem"(evt) {
    if (
      evt.params.args.data.id === evt.params.args.data.text &&
      !isEmail(evt.params.args.data.text)
    ) {
      // no valid mail anystring@anystring.anystring
      // prohibit non-mail free text entries
      ConfirmationDialogFactory.makeInfoDialog(
        i18n.__("Dialog.ActionItemResponsibleError.title"),
        i18n.__("Dialog.ActionItemResponsibleError.body"),
      ).show();
      return false;
    }
    return true;
  },

  "select2:select #id_selResponsibleActionItem"(evt) {
    const respId = evt.params.data.id;
    const respName = evt.params.data.text;
    const aUser = Meteor.users.findOne(respId);
    if (
      !aUser &&
      respId === respName && // we have a free-text user here!
      isEmail(respName)
    ) {
      // only take valid mail addresses
      _meetingSeries.addAdditionalResponsible(respName);
      _meetingSeries.save();
    }
  },

  "click .detailInputMarkdownHint"(evt) {
    handlerShowMarkdownHint(evt);
  },

  "click #btnExpandCollapse": function (evt, tmpl) {
    evt.preventDefault();

    const detailsArea = tmpl.find("#id_item_detailInput");
    detailsArea.style.display =
      detailsArea.style.display === "none" ? "inline-block" : "none";

    tmpl.collapseState.set(!tmpl.collapseState.get());

    const user = new User();
    user.storeSetting(userSettings.showAddDetail, tmpl.collapseState.get());
  },

  "click #btnInfoItemCancel": function (evt) {
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

  "keyup #id_item_detailInput": function (evt, tmpl) {
    const inputEl = tmpl.$("#id_item_detailInput");

    if (
      evt.which === 13 /*Enter*/ ||
      evt.which === 8 /*Backspace*/ ||
      evt.which === 46 /*Delete*/
    ) {
      resizeTextarea(inputEl);
    }
  },
});
