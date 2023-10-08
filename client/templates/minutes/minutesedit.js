import { QualityTestRunner } from "/imports/client/QualityTestRunner";
import { GlobalSettings } from "/imports/config/GlobalSettings";
import { DocumentGeneration } from "/imports/documentGeneration";
import { MeetingSeries } from "/imports/meetingseries";
import { Minutes } from "/imports/minutes";
import { Finalizer } from "/imports/services/finalize-minutes/finalizer";
import { MinutesFinder } from "/imports/services/minutesFinder";
import { UserRoles } from "/imports/userroles";
import { Blaze } from "meteor/blaze";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";
import moment from "moment/moment";

import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";
import { FlashMessage } from "../../helpers/flashMessage";
import { handleError } from "../../helpers/handleError";
import { UserTracker } from "../../helpers/userTracker";
import { TopicListConfig } from "../topic/topicsList";

let _minutesID; // the ID of these minutes

/**
 *
 * @type {FlashMessage}
 */
let orphanFlashMessage = null;

const filterClosedTopics = new ReactiveVar(false);

/**
 * togglePrintView
 * Prepares the DOM view for printing - on and off
 * @param switchOn - optional (if missing, function toggles on <=> off)
 */
const togglePrintView = (switchOn) => {
  if (switchOn === undefined) {
    // toggle on <=> off
    Session.set(
      "minutesedit.PrintViewActive",
      !Session.get("minutesedit.PrintViewActive"),
    );
  } else {
    Session.set("minutesedit.PrintViewActive", switchOn);
  }

  if (Session.get("minutesedit.PrintViewActive")) {
    // expand all topics, but save current state before!
    Session.set(
      `minutesedit.collapsetopics-save4print.${_minutesID}`,
      Session.get(`minutesedit.collapsetopics.${_minutesID}`),
    );
    Session.set(`minutesedit.collapsetopics.${_minutesID}`);

    Session.set("participants.expand", false);
    $(".help").hide();
    Meteor.setTimeout(() => {
      $(".collapse").addClass("in");
    }, 100);

    // give collapsibles some time for animation
    Meteor.setTimeout(() => {
      $(".expand-collapse-triangle").hide();
    }, 350);
    // as material checkboxes do not print correctly...
    // change material checkbox to normal checkbox for printing
    Meteor.setTimeout(() => {
      $("div.checkbox").toggleClass("checkbox print-checkbox");
    }, 360);
    Meteor.setTimeout(() => {
      openPrintDialog();
    }, 500);
  } else {
    // change back normal checkboxes to material checkboxes after printing
    $("div.print-checkbox").toggleClass("checkbox print-checkbox");
    $(".expand-collapse-triangle").show();
    $(".collapse").removeClass("in");
    // restore old topic collapsible state
    Session.set(
      `minutesedit.collapsetopics.${_minutesID}`,
      Session.get(`minutesedit.collapsetopics-save4print.${_minutesID}`),
    );
  }
};

// Automatically restore view after printing
(() => {
  const afterPrint = () => {
    togglePrintView(false);
  };

  if (window.matchMedia) {
    const mediaQueryList = window.matchMedia("print");
    mediaQueryList.addListener((mql) => {
      if (!mql.matches) {
        afterPrint();
      }
    });
  }

  window.onafterprint = afterPrint;
})();

// Global keyboard shortcut handler for this template
// In Meteor global key events can only be bound to the template on <INPUT>
// elements If we want to have these key events really global, we have to
// register them with the document. For details see SO:
// http://stackoverflow.com/questions/27972873/meteor-keydown-keyup-events-outside-input
const handleTemplatesGlobalKeyboardShortcuts = (switchOn) => {
  if (switchOn) {
    $(document).keydown((evt) => {
      if ($(".modal.in").length > 0) {
        // any modal dialog open?
        return;
      }
      // console.log("keydown", evt);
      // check if focus is in input-text or input-textarea
      // let el = document.activeElement;
      // if (el && (el.tagName.toLowerCase() == 'input' && el.type == 'text' ||
      //     el.tagName.toLowerCase() == 'textarea')) {
      //     return;
      // }

      // Listen for "Ctrl+Alt+T" for "Add Topic" (Alt+T in IE11)
      // accesskey attribute is not an option, as it needs browser specific
      // modifieres (see www.w3schools.com/tags/att_global_accesskey.asp) and
      // accessKeyLabel is not implemented in all browsers
      if (evt.ctrlKey && evt.altKey && !evt.shiftKey && evt.keyCode === 84) {
        $("#dlgAddTopic").modal("show");
        evt.preventDefault();
      }
    });
  } else {
    $(document).off("keydown");
  }
};

Template.minutesedit.onRendered(function () {
  const tmpl = this; // store for second, inner callback
  // Ugly hack...   :-(
  // For some strange reason, our DOM element is not available immediately
  // (Blaze API tells us differently!) - so, we give it some time to settle
  Meteor.setTimeout(() => {
    const target = tmpl.find("#editGlobalNotes");
    if (target) {
      target.style.height = 0;
      target.style.overflow = "auto";
      target.style.height = `${target.scrollHeight}px`;
      target.style.maxHeight = "700px";
    }
  }, 2000);

  filterClosedTopics.set(false);
});

Template.minutesedit.onCreated(function () {
  this.minutesReady = new ReactiveVar();
  this.currentMinuteLoaded = new ReactiveVar();

  this.autorun(() => {
    _minutesID = FlowRouter.getParam("_id");

    this.currentMinuteLoaded.set(
      this.subscribe("minutes", undefined, _minutesID),
    );
    if (this.currentMinuteLoaded.get().ready()) {
      const meetingSeriesId = new Minutes(_minutesID).parentMeetingSeriesID();
      this.subscribe("minutes", meetingSeriesId);
      this.subscribe("meetingSeriesDetails", meetingSeriesId);
      this.subscribe("files.attachments.all", meetingSeriesId, _minutesID);
      this.subscribe("files.protocols.all", meetingSeriesId, _minutesID);

      this.minutesReady.set(this.subscriptionsReady());
    }
  });

  Session.set("minutesedit.checkParent", false);
  handleTemplatesGlobalKeyboardShortcuts(true);

  this.userTracker = new UserTracker(FlowRouter.current().path);
  this.userTracker.onEnter();
});

Template.minutesedit.onDestroyed(function () {
  if (orphanFlashMessage !== null) {
    orphanFlashMessage.hideMe();
  }
  $(window).off("scroll"); // Prohibit accumulating multiple scroll handlers on window
  $(document).unbindArrive("#id_minutesdatePicker");
  $(document).unbindArrive("#topicPanel");
  handleTemplatesGlobalKeyboardShortcuts(false);
  this.userTracker.onLeave();
});

const isMinuteFinalized = () => {
  const aMin = new Minutes(_minutesID);
  return aMin?.isFinalized;
};

const isModerator = () => {
  const aMin = new Minutes(_minutesID);
  return aMin?.isCurrentUserModerator();
};

const toggleTopicSorting = () => {
  let topicList = $("#topicPanel"),
    isFinalized = isMinuteFinalized();

  if (!isFinalized && isModerator()) {
    topicList.sortable("enable");
  }

  if (isFinalized) {
    topicList.sortable("disable");
  }
};

const updateTopicSorting = (event, ui) => {
  const draggedTopicID = $(ui.item).attr("data-id");
  if (!draggedTopicID) {
    return;
  }

  // Attention: In the DOM we only see the currently visible topics.
  // Some topics may be hidden due to "hide closed topics" feature
  let sorting = $("#topicPanel").find("> div.well"),
    minute = new Minutes(_minutesID),
    newTopicSorting = [];

  // In visible topics find new target pos
  let newTargetPos = sorting.length - 1;
  for (let i = 0; i < sorting.length; ++i) {
    if ($(sorting[i]).attr("data-id") === draggedTopicID) {
      newTargetPos = i;
    }
  }
  // In visible topics find ID of the following topic, or '' if dragged to end
  // of list
  let followerTopicID = ""; // The ID of the topic below the dragged one
  if (newTargetPos < sorting.length - 1) {
    followerTopicID = $(sorting[newTargetPos + 1]).attr("data-id");
  }
  // In *all* topics before(!) the drag operation find
  // * position of dragged topic and
  // * position of follower after drag operation
  const oldDragTopicPos = minute.topics.findIndex(
    (t) => t._id === draggedTopicID,
  );
  const oldFollowerPos = minute.topics.findIndex(
    (t) => t._id === followerTopicID,
  );

  // Perform position change in complete topic array coming from DB
  // Here we also have currently hidden topics
  newTopicSorting = minute.topics;
  const topic = newTopicSorting[oldDragTopicPos]; // remember topic
  newTopicSorting.splice(oldDragTopicPos, 1); // remove topic from array
  if (oldFollowerPos >= 0) {
    // insert before new follower
    const correction = oldDragTopicPos > oldFollowerPos ? 0 : 1;
    newTopicSorting.splice(oldFollowerPos - correction, 0, topic);
  } else {
    const lastVisibleTopicId = $(sorting[sorting.length - 2]).attr("data-id");
    const lastVisibleTopicPos = newTopicSorting.findIndex(
      (t) => t._id === lastVisibleTopicId,
    );

    // we want to add the topic AFTER the last visible topic, not before
    newTopicSorting.splice(lastVisibleTopicPos + 1, 0, topic);
  }

  // Write new sort order to DB
  minute.update({ topics: newTopicSorting }).catch((error) => {
    $("#topicPanel").sortable("cancel");
    handleError(error);
  });
};

const openPrintDialog = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = ua.indexOf("android") > -1;

  window.print();
};

let sendActionItems = true;
let sendInformationItems = true;

Template.minutesedit.helpers({
  setDocumentTitle() {
    const min = new Minutes(_minutesID);
    const ms = min.parentMeetingSeries();
    document.title = `4M! ${ms.name} [${ms.project}] ${min.date}`;
    // Hint: this will be resetted on router's exit hook (see router.js).
  },

  authenticating() {
    const subscriptionReady = Template.instance().minutesReady.get();
    return Meteor.loggingIn() || !subscriptionReady;
  },

  canShow() {
    const usrRoles = new UserRoles();

    const minute = new Minutes(_minutesID);
    if (!usrRoles.hasViewRoleFor(minute.parentMeetingSeriesID())) {
      FlowRouter.redirect("/");
    }

    return true;
  },

  initialize() {
    const templateInstance = Template.instance();

    $(document).arrive("#id_minutesdatePicker", () => {
      // Configure DateTimePicker
      moment.locale("en", {
        week: { dow: 1 }, // Monday is the first day of the week
      });

      const datePickerNode = templateInstance.$("#id_minutesdatePicker");
      // see http://eonasdan.github.io/bootstrap-datetimepicker/Options/
      datePickerNode.datetimepicker({
        format: "YYYY-MM-DD",
        // calendarWeeks: true, // unfortunately this leads to "NaN" weeks on
        // some systems...
        showTodayButton: true,
      });

      const aMin = new Minutes(_minutesID);
      if (!aMin.isFinalized) {
        const ms = aMin.parentMeetingSeries();
        if (ms) {
          const minDate = ms.getMinimumAllowedDateForMinutes(_minutesID);
          if (minDate) {
            minDate.setDate(minDate.getDate() + 1);
            datePickerNode.data("DateTimePicker").minDate(minDate);
          }
        }
      }
    });

    $(document).arrive("#topicPanel", () => {
      $("#topicPanel").sortable({
        appendTo: document.body,
        axis: "y",
        items: "> .well",
        opacity: 0.5,
        disabled: true,
        handle: ".topicDragDropHandle",
        update: updateTopicSorting,
      });

      toggleTopicSorting();
    });

    // enable the parent series check after 2.5 seconds delay to make sure
    // there was enough time to update the meeting series
    Meteor.setTimeout(() => {
      Session.set("minutesedit.checkParent", true);
    }, 2500);
  },

  checkParentSeries: function () {
    if (!Session.get("minutesedit.checkParent")) return;

    const aMin = new Minutes(_minutesID);
    try {
      aMin.checkParent();
      if (orphanFlashMessage !== null) {
        orphanFlashMessage.hideMe();
        orphanFlashMessage = null;
      }
    } catch (error) {
      orphanFlashMessage = new FlashMessage(
        i18n.__("FlashMessages.error"),
        i18n.__("FlashMessages.minuteLinkErr"),
        "alert-danger",
        -1,
      ).show();
    }
  },

  meetingSeries: function () {
    const aMin = new Minutes(_minutesID);
    if (aMin) {
      return aMin.parentMeetingSeries();
    }
    return null;
  },

  minutes: function () {
    const aMin = new Minutes(_minutesID);
    if (aMin) {
      return aMin;
    }
    return null;
  },

  isFinalized: function () {
    return isMinuteFinalized();
  },

  getFinalizedText: function () {
    return Finalizer.finalizedInfo(_minutesID);
  },

  finalizeHistoryTooltip: function (buttontype) {
    const aMin = new Minutes(_minutesID);
    let tooltip = buttontype ? `${i18n.__(buttontype)}\n` : "";
    if (aMin.finalizedHistory) {
      tooltip +=
        "\n" +
        i18n.__("Minutes.history") +
        ":\n" +
        aMin.finalizedHistory.join("\n");
    }
    return tooltip;
  },

  disableUIControl: function () {
    const aMin = new Minutes(_minutesID);
    const usrRole = new UserRoles();
    return aMin.isFinalized ||
      !usrRole.isModeratorOf(aMin.parentMeetingSeriesID())
      ? "disabled"
      : "";
  },

  isUnfinalizeAllowed: function () {
    return Finalizer.isUnfinalizeMinutesAllowed(_minutesID);
  },

  isModeratorOfParentSeries: function () {
    const aMin = new Minutes(_minutesID);
    const usrRole = new UserRoles();

    return usrRole.isModeratorOf(aMin.parentMeetingSeriesID());
  },

  getTopicsListConfig: function () {
    const aMin = new Minutes(_minutesID);
    let filteredTopics = aMin.topics;
    if (filterClosedTopics.get()) {
      filteredTopics = aMin.topics.filter(
        (topic) => topic.isOpen && !topic.isSkipped,
      );
    } else {
      if (!isModerator()) {
        filteredTopics = aMin.topics.filter((topic) => !topic.isSkipped);
      }
    }

    return new TopicListConfig(
      filteredTopics,
      _minutesID,
      /*readonly*/ isMinuteFinalized() || !isModerator(),
      aMin.parentMeetingSeriesID(),
    );
  },

  isReadOnly() {
    return isMinuteFinalized() || !isModerator();
  },

  isPrintView() {
    if (Session.get("minutesedit.PrintViewActive")) {
      return "btn-info";
    }
  },

  minutesPath: function (minutesId) {
    return Blaze._globalHelpers.pathFor("/minutesedit/:_id", {
      _id: minutesId,
    });
  },

  previousMinutes: function () {
    const aMin = new Minutes(_minutesID);
    return MinutesFinder.previousMinutes(aMin);
  },

  nextMinutes: function () {
    const aMin = new Minutes(_minutesID);
    return MinutesFinder.nextMinutes(aMin);
  },

  displayCreateNextMinutes: function () {
    return isModerator() && isMinuteFinalized();
  },

  isDocumentGenerationAllowed: function () {
    return Meteor.settings.public.docGeneration.enabled === true;
  },

  theProtocol: function () {
    return DocumentGeneration.getProtocolForMinute(_minutesID);
  },
});

Template.minutesedit.events({
  "click #checkHideClosedTopics": function (evt) {
    const isChecked = evt.target.checked;
    filterClosedTopics.set(isChecked);
  },

  "click #btnCreateNewMinutes": function (evt) {
    evt.preventDefault();
    const ms = new MeetingSeries(
      new Minutes(_minutesID).parentMeetingSeriesID(),
    );
    const routeToNewMinutes = (newMinutesId) => {
      Session.set("minutesedit.checkParent", false);
      FlowRouter.redirect(`/minutesedit/${newMinutesId}`);
    };
    const confirmationDialog =
      ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
        () => ms.addNewMinutes(routeToNewMinutes, handleError),
        i18n.__("Dialog.ConfirmCreateNewMinutes.title"),
        "confirmationDialogCreateNewMinutes",
        {
          project: ms.project,
          name: ms.name,
        },
        i18n.__("Buttons.create"),
      );
    confirmationDialog.show();
  },

  "dp.change #id_minutesdatePicker": function (evt, tmpl) {
    const aMin = new Minutes(_minutesID);
    if (aMin.isFinalized || !aMin.isCurrentUserModerator()) {
      // event will be called on page load
      // if the meeting is already finalized ...
      // or the current user is not a moderator ...
      // nothing has to be updated
      return;
    }

    const dateNode = tmpl.$("#id_minutesdateInput");
    const aDate = tmpl.find("#id_minutesdateInput").value;

    dateNode.parent().removeClass("has-error");
    if (!aMin.parentMeetingSeries().isMinutesDateAllowed(aMin._id, aDate)) {
      dateNode.parent().addClass("has-error");
      tmpl.find("#id_minutesdateInput").value = aMin.date;
      return;
    }

    aMin.update({ date: aDate }).catch(handleError);
  },

  "keyup #editGlobalNotes"(evt) {
    evt.preventDefault();
    evt.target.style.height = 0;
    evt.target.style.overflow = "auto";
    evt.target.style.height = `${evt.target.scrollHeight}px`;
    evt.target.style.maxHeight = "700px";
  },

  "change #editGlobalNotes"(evt, tmpl) {
    evt.preventDefault();
    const aMin = new Minutes(_minutesID);
    const globalNote = tmpl.find("#editGlobalNotes").value;
    aMin.update({ globalNote }).catch(handleError);
  },

  "click #btn_sendAgenda": async function (evt, tmpl) {
    evt.preventDefault();
    const sendBtn = tmpl.$("#btn_sendAgenda");
    const aMin = new Minutes(_minutesID);
    console.log(
      `Send agenda: ${aMin._id} from series: ${aMin.meetingSeries_id}`,
    );

    const sendAgenda = async () => {
      sendBtn.prop("disabled", true);
      try {
        const result = await aMin.sendAgenda();
        new FlashMessage(
          i18n.__("FlashMessages.ok"),
          i18n.__("FlashMessages.agendaSentOK", { result }),
          "alert-success"
        ).show();
      } catch (error) {
        handleError(error);
      }
      sendBtn.prop("disabled", false);
    };

    const agendaCheckDate = async () => {
      if (aMin.getAgendaSentAt()) {
        const date = aMin.getAgendaSentAt();
        console.log(date);

        ConfirmationDialogFactory.makeSuccessDialog(
          sendAgenda,
          i18n.__("Dialog.ConfirmSendAgenda.title"),
          i18n.__("Dialog.ConfirmSendAgenda.body", {
            minDate: aMin.date,
            agendaSentDate: moment(date).format("YYYY-MM-DD"),
            agendaSentTime: moment(date).format("h:mm"),
          }),
          {},
          i18n.__("Dialog.ConfirmSendAgenda.button"),
        ).show();
      } else {
        await sendAgenda();
      }
    };

    QualityTestRunner.run(
      QualityTestRunner.TRIGGERS.sendAgenda,
      aMin,
      agendaCheckDate,
    );
  },

  "click #btn_finalizeMinutes": function (evt, tmpl) {
    evt.preventDefault();
    const aMin = new Minutes(_minutesID);
    console.log(
      "Finalize minutes: " +
        aMin._id +
        " from series: " +
        aMin.meetingSeries_id,
    );

    const doFinalize = () => {
      tmpl.$("#btn_finalizeMinutes").prop("disabled", true);
      const msg = new FlashMessage(
        i18n.__("FlashMessages.finalizeProgress1"),
        i18n.__("FlashMessages.finalizeProgress2"),
        "alert-info",
        -1,
      ).show();
      // Force closing the dialog before starting the finalize process
      Meteor.setTimeout(() => {
        Finalizer.finalize(
          aMin._id,
          sendActionItems,
          sendInformationItems,
          handleError,
        );
        tmpl.$("#btn_finalizeMinutes").prop("disabled", true);
        new FlashMessage(
          i18n.__("FlashMessages.ok"),
          i18n.__("FlashMessages.finalizeOK"),
          FlashMessage.TYPES().SUCCESS,
          3000,
        ).show();
        msg.hideMe();
        toggleTopicSorting();
        Session.set("participants.expand", false);
      }, 500);
    };

    const processFinalize = () => {
      if (GlobalSettings.isEMailDeliveryEnabled()) {
        ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
          doFinalize,
          i18n.__("Dialog.ConfirmFinalizeMinutes.title"),
          "confirmationDialogFinalize",
          {
            minutesDate: aMin.date,
            hasOpenActionItems: aMin.hasOpenActionItems(),
            sendActionItems: sendActionItems ? "checked" : "",
            sendInformationItems: sendInformationItems ? "checked" : "",
          },
          i18n.__("Dialog.ConfirmFinalizeMinutes.button"),
        ).show();
      } else {
        doFinalize();
      }
    };

    QualityTestRunner.run(
      QualityTestRunner.TRIGGERS.finalize,
      aMin,
      processFinalize,
    );
  },

  "click #btn_unfinalizeMinutes": function (evt) {
    evt.preventDefault();
    const aMin = new Minutes(_minutesID);
    console.log(
      "Un-Finalize minutes: " +
        aMin._id +
        " from series: " +
        aMin.meetingSeries_id,
    );
    Finalizer.unfinalize(aMin._id);

    toggleTopicSorting();
    Session.set("participants.expand", true);
  },

  "click #btn_deleteMinutes": function (evt) {
    evt.preventDefault();
    const aMin = new Minutes(_minutesID);
    console.log(
      "Remove Meeting Minute " +
        this._id +
        " from Series: " +
        this.meetingSeries_id,
    );

    const deleteMinutesCallback = () => {
      const ms = new MeetingSeries(aMin.meetingSeries_id);
      // first route to the parent meetingseries then remove the minute.
      // otherwise the current route would automatically re-routed to the main
      // page because the minute is not available anymore -> see router.js
      FlowRouter.go(`/meetingseries/${aMin.meetingSeries_id}`);
      ms.removeMinutesWithId(aMin._id).catch(handleError);
    };

    const newTopicsCount = aMin.getNewTopics().length;
    const closedOldTopicsCount = aMin.getOldClosedTopics().length;

    const tmplData = {
      minutesDate: aMin.date,
      hasNewTopics: newTopicsCount > 0,
      newTopicsCount,
      hasClosedTopics: closedOldTopicsCount > 0,
      closedTopicsCount: closedOldTopicsCount,
    };

    ConfirmationDialogFactory.makeWarningDialogWithTemplate(
      deleteMinutesCallback,
      i18n.__("Dialog.ConfirmDelete.title"),
      "confirmationDialogDeleteMinutes",
      tmplData,
    ).show();
  },

  "click #btnCollapseAll": function () {
    const aMin = new Minutes(_minutesID);
    const sessionCollapse = {};
    for (const topicIndex in aMin.topics) {
      const topicId = aMin.topics[topicIndex]._id;
      sessionCollapse[topicId] = true;
    }
    Session.set(`minutesedit.collapsetopics.${_minutesID}`, sessionCollapse);
  },

  "click #btnExpandAll": function () {
    Session.set(`minutesedit.collapsetopics.${_minutesID}`);
  },

  "click #btn_printMinutes": function (evt) {
    evt.preventDefault();
    togglePrintView();
  },

  "click #btn_dynamicallyGenerateProtocol": function (evt) {
    evt.preventDefault();

    const noProtocolExistsDialog = (downloadHTML) => {
      ConfirmationDialogFactory.makeSuccessDialogWithTemplate(
        downloadHTML,
        i18n.__("Dialog.ConfirmGenerateProtocol.title"),
        "confirmPlainText",
        { plainText: i18n.__("Dialog.ConfirmGenerateProtocol.body") },
        i18n.__("Dialog.ConfirmGenerateProtocol.button"),
      ).show();
    };

    DocumentGeneration.downloadMinuteProtocol(
      _minutesID,
      noProtocolExistsDialog,
    ).catch(handleError);
  },

  "click #btnPinGlobalNote": function (evt) {
    evt.preventDefault();
    if (!isModerator() || isMinuteFinalized()) {
      return;
    }
    const aMin = new Minutes(_minutesID);
    aMin
      .update({ globalNotePinned: !aMin.globalNotePinned })
      .catch(handleError);
  },
});

// pass event handler for the send-email checkbox to the confirmation dialog
// so we can track changes
Template.confirmationDialog.events({
  "change #cbSendAI": function (evt) {
    sendActionItems = evt.target.checked;
  },
  "change #cbSendII": function (evt) {
    sendInformationItems = evt.target.checked;
  },
});
