import { handleError } from "/client/helpers/handleError";
import { MeetingSeries } from "/imports/meetingseries";
import { $ } from "meteor/jquery";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveDict } from "meteor/reactive-dict";
import { Template } from "meteor/templating";

function clearForm(template) {
  template.find("#id_meetingproject").value = "";
  template.find("#id_meetingname").value = "";
  template.find("#id_meetingproject").focus();
}

function escapeHandler(event) {
  event.preventDefault();

  let escapeWasPressed = event.key === "Escape";

  // for browsers that do not support event.key yet
  escapeWasPressed |= event.keyCode === 27;

  if (escapeWasPressed) {
    $("#collapseMeetingSeriesAdd").collapse("hide");
  }
}

function addMeetingSeries(template, optimisticUICallback) {
  const aProject = template.find("#id_meetingproject").value;
  const aName = template.find("#id_meetingname").value;

  const ms = new MeetingSeries({
    project: aProject,
    name: aName,
    createdAt: new Date(),
  });

  ms.saveAsync(optimisticUICallback).catch(handleError);
}

Template.meetingSeriesAdd.helpers({
  isExpanded() {
    return ReactiveDict.get("meetingSeriesAdd.isExpanded");
  },
  meetingSeriesAmountBiggerFour() {
    return MeetingSeries.find().count() > 4;
  },
});

Template.meetingSeriesAdd.events({
  "submit #id_meetingSeriesAddForm"(event, template) {
    event.preventDefault();
    const aProject = template.find("#id_meetingproject").value;
    const aName = template.find("#id_meetingname").value;
    if (aProject === "" || aName === "") {
      return;
    }

    $("#collapseMeetingSeriesAdd").collapse("hide");

    addMeetingSeries(template, (id) => {
      FlowRouter.go(`/meetingseries/${id}?edit=true`);
    });
  },

  "hidden.bs.collapse #collapseMeetingSeriesAdd"(evt, tmpl) {
    clearForm(tmpl);
    ReactiveDict.set("meetingSeriesAdd.isExpanded", false);
    document.removeEventListener("keyup", escapeHandler);
  },

  "shown.bs.collapse #collapseMeetingSeriesAdd"(evt, tmpl) {
    tmpl.find("#id_meetingproject").focus();
    ReactiveDict.set("meetingSeriesAdd.isExpanded", true);
    document.addEventListener("keyup", escapeHandler);
  },
});
