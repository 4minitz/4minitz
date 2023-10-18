import { MeetingSeries } from "/imports/meetingseries";
import { Minutes } from "/imports/minutes";
import { Topic } from "/imports/topic";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { LabelResolver } from "../../../imports/services/labelResolver";
import { ResponsibleResolver } from "../../../imports/services/responsibleResolver";
import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";
import { handleError } from "../../helpers/handleError";

import { detectTypeAndCreateItem } from "./helpers/create-item";
import { labelSetFontColor } from "./helpers/label-set-font-color";
import { resizeTextarea } from "./helpers/resize-textarea";
import { TopicInfoItemListContext } from "./topicInfoItemList";

let _minutesId;
const INITIAL_ITEMS_LIMIT = 4;

const isFeatureShowItemInputFieldOnDemandEnabled = () => {
  return !(Meteor.settings?.public && Meteor.settings.public.isEnd2EndTest);
};

Template.topicElement.onCreated(function () {
  const tmplData = Template.instance().data;
  _minutesId = tmplData.minutesID;

  this.isItemsLimited = new ReactiveVar(
    tmplData.topic.infoItems.length > INITIAL_ITEMS_LIMIT,
  );
  this.isCollapsed = new ReactiveVar(false);
});

Template.topicElement.helpers({
  isTopicFinallyCompleted() {
    let aTopic = undefined;
    if (this.minutesID) {
      // on minutes edit view
      aTopic = new Topic(this.minutesID, this.topic._id);
    } else if (this.parentMeetingSeriesId) {
      // on meeting series topic view
      aTopic = new Topic(this.parentMeetingSeriesId, this.topic._id);
    }
    if (aTopic) {
      return aTopic.isFinallyCompleted();
    }
  },

  hideAddItemInputField() {
    return isFeatureShowItemInputFieldOnDemandEnabled();
  },

  getLabels() {
    const tmplData = Template.instance().data;
    return LabelResolver.resolveLabels(
      this.topic.labels,
      tmplData.parentMeetingSeriesId,
    ).map(labelSetFontColor);
  },

  checkedState() {
    return this.topic.isOpen ? "" : { checked: "checked" };
  },

  disabledState() {
    return this.isEditable && !this.topic.isSkipped
      ? ""
      : { disabled: "disabled" };
  },

  // determine if this topic shall be rendered collapsed
  isCollapsed() {
    const collapseState = Session.get(
      `minutesedit.collapsetopics.${_minutesId}`,
    );
    return collapseState ? collapseState[this.topic._id] : false;
  },

  showRecurringIcon() {
    return this.isEditable || this.topic.isRecurring;
  },

  responsiblesHelper() {
    try {
      const responsible =
        ResponsibleResolver.resolveAndformatResponsiblesString(
          this.topic.responsibles,
        );
      return responsible ? `(${responsible})` : "";
    } catch (e) {
      // intentionally left blank.
      // on deletion of a topic blaze once calls this method on the just deleted
      // topic we handle this gracefully with this empty exception handler
    }
    return "";
  },

  getData() {
    const data = Template.instance().data;
    const parentElement = data.minutesID
      ? data.minutesID
      : data.parentMeetingSeriesId;
    return TopicInfoItemListContext.createContextForItemsOfOneTopic(
      data.topic.infoItems,
      !data.isEditable,
      parentElement,
      data.topic._id,
    );
  },

  classForEdit() {
    return this.isEditable ? "btnEditTopic" : "";
  },

  classForSkippedTopics() {
    return this.topic.isSkipped ? "strikethrough" : "";
  },

  cursorForEdit() {
    return this.isEditable ? "pointer" : "";
  },

  showMenu() {
    return (
      this.isEditable || // Context: Current non-finalized Minute
      (!this.minutesID &&
        !this.topic.isOpen &&
        new MeetingSeries(this.parentMeetingSeriesId).isCurrentUserModerator())
    ); // Context: Closed Topic within
    // MeetingSeries, user is moderator;
  },
});

const editTopicEventHandler = (evt, context, manipulateTopic) => {
  evt.preventDefault();
  if (!context.minutesID || !context.isEditable) {
    return;
  }
  const aTopic = new Topic(context.minutesID, context.topic._id);
  manipulateTopic(aTopic);
};

const openAddItemDialog = (itemType, topicId) => {
  Session.set("topicInfoItemEditTopicId", topicId);
  Session.set("topicInfoItemType", itemType);
};

const showHideItemInput = (tmpl, show = true, then = () => {}) => {
  if (!isFeatureShowItemInputFieldOnDemandEnabled()) {
    return;
  }

  const addItemEl = tmpl.$(".addItemForm");
  const theItemTextarea = tmpl.$(".add-item-field");
  if (show) {
    addItemEl.show(250);
    Meteor.setTimeout(() => {
      resizeTextarea(theItemTextarea);
      then();

      Meteor.setTimeout(() => {
        // only focus, if parent topic element fits in view port
        if (tmpl.$(".topic-element").outerHeight() < window.innerHeight) {
          theItemTextarea.focus();
        }
      }, 50);
    }, 300);
  } else {
    addItemEl.hide(250);
  }
};

let savingNewItem = false;

Template.topicElement.events({
  "click .topic-element"(evt, tmpl) {
    // return if the current target is not the original target of the event
    if (
      evt.currentTarget.getAttribute("class") !==
      evt.target.getAttribute("class")
    ) {
      return;
    }

    if (tmpl.$(".topic-element").hasClass("focus")) {
      // guard against multiple nested calls
      return;
    }
    tmpl.$(".topic-element").addClass("focus");
    showHideItemInput(tmpl);
  },

  "blur .topic-element"(evt, tmpl) {
    if (!tmpl.$(".topic-element").hasClass("focus")) {
      // guard against multiple nested calls
      return;
    }
    if (savingNewItem) {
      savingNewItem = false;
      return;
    }
    const nextElement = evt.relatedTarget;
    const topicElement = tmpl.find(".topic-element");
    if (!nextElement || !topicElement.contains(nextElement)) {
      tmpl.$(".topic-element").removeClass("focus");
      // Meteor.setTimeout(() => { showHideItemInput(tmpl, false); }, 500);
      showHideItemInput(tmpl, false);
    }
  },

  "click #btnDelTopic"(evt) {
    evt.preventDefault();

    if (!this.minutesID) {
      return;
    }
    console.log(
      `Delete topics: ${this.topic._id} from minutes ${this.minutesID}`,
    );

    const aMin = new Minutes(this.minutesID);

    const topic = new Topic(this.minutesID, this.topic);
    const deleteAllowed = topic.isDeleteAllowed();

    if (!topic.isFinallyCompleted() || deleteAllowed) {
      ConfirmationDialogFactory.makeWarningDialogWithTemplate(
        () => {
          if (deleteAllowed) {
            aMin.removeTopic(this.topic._id).catch(handleError);
          } else {
            topic.closeTopicAndAllOpenActionItems().catch(handleError);
          }
        },
        deleteAllowed
          ? i18n.__("Dialog.ConfirmTopicDelete.title1")
          : i18n.__("Dialog.ConfirmTopicDelete.title2"),
        "confirmDeleteTopic",
        {
          deleteAllowed: topic.isDeleteAllowed(),
          hasOpenActionItems: topic.hasOpenActionItem(),
          subject: topic.getSubject(),
        },
        deleteAllowed
          ? i18n.__("Buttons.delete")
          : i18n.__("Dialog.ConfirmTopicDelete.button2"),
      ).show();
    } else {
      ConfirmationDialogFactory.makeInfoDialog(
        i18n.__("Dialog.ConfirmTopicDelete.errortitle"),
        i18n.__("Dialog.ConfirmTopicDelete.errorcontent"),
      ).show();
    }
  },

  "click .btnToggleState"(evt) {
    editTopicEventHandler(evt, this, (aTopic) => {
      aTopic.toggleState().catch(handleError);
    });
  },

  "click #btnShowTopic"() {
    FlowRouter.go(`/topic/${this.topic._id}`);
  },

  "click .js-toggle-recurring"(evt) {
    editTopicEventHandler(evt, this, (aTopic) => {
      aTopic.toggleRecurring();
      aTopic.save().catch(handleError);
    });
  },

  "click .js-toggle-skipped"(evt) {
    editTopicEventHandler(evt, this, (aTopic) => {
      aTopic.toggleSkip();
      aTopic.save().catch(handleError);
    });
  },

  "click #btnEditTopic"(evt) {
    evt.preventDefault();
    if (!this.minutesID || getSelection().toString()) {
      // don't fire while selection is ongoing
      return;
    }
    Session.set("topicEditTopicId", this.topic._id);
    $("#dlgAddTopic").modal("show");
  },

  "click .addTopicInfoItem"(evt) {
    evt.preventDefault();
    // will be called before the modal dialog is shown
    openAddItemDialog("infoItem", this.topic._id);
  },

  "click .addTopicActionItem"(evt) {
    evt.preventDefault();
    // will be called before the modal dialog is shown
    openAddItemDialog("actionItem", this.topic._id);
  },

  "blur .addItemForm"(evt, tmpl) {
    if (!tmpl.data.isEditable) {
      throw new Meteor.Error(
        "illegal-state",
        "Tried to call an illegal event in read-only mode",
      );
    }

    const theItemTextarea = tmpl.find(".add-item-field");
    const inputText = theItemTextarea.value;

    if (inputText === "") {
      return;
    }

    savingNewItem = true;
    const splitIndex = inputText.indexOf("\n");
    const subject =
      splitIndex === -1 ? inputText : inputText.substring(0, splitIndex);
    const detail =
      splitIndex === -1 ? "" : inputText.substring(splitIndex + 1).trim();

    const itemDoc = {
      subject,
      responsibles: [],
      createdInMinute: this.minutesID,
    };

    const topic = new Topic(this.minutesID, this.topic);
    const minutes = new Minutes(this.minutesID);
    const newItem = detectTypeAndCreateItem(
      itemDoc,
      topic,
      this.minutesID,
      minutes.parentMeetingSeries(),
    );
    if (detail) {
      newItem.addDetails(this.minutesID, detail);
    }
    newItem.saveAtBottom().catch((error) => {
      theItemTextarea.value = inputText; // set desired value again!
      handleError(error);
    });

    let collapseState = Session.get(`minutesedit.collapsetopics.${_minutesId}`);
    if (!collapseState) {
      collapseState = {};
    }
    collapseState[this.topic._id] = false;
    Session.set(`minutesedit.collapsetopics.${_minutesId}`, collapseState);

    // Clean & focus for next usage after saving last item
    theItemTextarea.value = "";
    resizeTextarea(theItemTextarea);
    Meteor.setTimeout(() => {
      theItemTextarea.focus();
    }, 100);
  },

  "keydown .addItemForm"(evt, tmpl) {
    const inputEl = tmpl.$(".add-item-field");
    if (evt.which === 13 /*enter*/ && (evt.ctrlKey || evt.metaKey)) {
      evt.preventDefault();
      inputEl.blur();
    }

    resizeTextarea(inputEl);
  },

  "keydown #btnTopicExpandCollapse"(evt) {
    evt.preventDefault();
    // since we do not have a link-href the link will not be clicked when
    // hitting enter by default...
    if (evt.which === 13 /*enter*/) {
      evt.currentTarget.click();
    }
  },

  "click #btnTopicExpandCollapse"(evt) {
    console.log(`btnTopicExpandCollapse()${this.topic._id}`);
    evt.preventDefault();
    let collapseState = Session.get(`minutesedit.collapsetopics.${_minutesId}`);
    if (!collapseState) {
      collapseState = {};
    }
    collapseState[this.topic._id] = !collapseState[this.topic._id];
    Session.set(`minutesedit.collapsetopics.${_minutesId}`, collapseState);
  },

  "click #btnReopenTopic"(evt) {
    evt.preventDefault();
    const reopenTopic = () => {
      Meteor.call(
        "workflow.reopenTopicFromMeetingSeries",
        this.parentMeetingSeriesId,
        this.topic._id,
      );
    };
    ConfirmationDialogFactory.makeSuccessDialog(
      reopenTopic,
      i18n.__("Dialog.ConfirmReOpenTopic.title"),
      i18n.__("Dialog.ConfirmReOpenTopic.body", {
        topicSubject: Template.instance().data.topic.subject,
      }),
      {},
      i18n.__("Dialog.ConfirmReOpenTopic.button"),
    ).show();
  },
});
