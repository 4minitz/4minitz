import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";
import { Session } from "meteor/session";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import { Minutes } from "/imports/minutes";
import { UserRoles } from "/imports/userroles";
import { ReactiveVar } from "meteor/reactive-var";
import { handleError } from "/client/helpers/handleError";
import { OnlineUsersSchema } from "/imports/collections/onlineusers.schema";
import "/imports/collections/onlineusers_private";

let _minutesID; // the ID of these minutes

let isEditable = function () {
  let min = new Minutes(_minutesID);
  return min.isCurrentUserModerator() && !min.isFinalized;
};

let isModeratorOfParentSeries = function (userId) {
  let aMin = new Minutes(_minutesID);
  let usrRole = new UserRoles(userId);
  return usrRole.isModeratorOf(aMin.parentMeetingSeriesID());
};

let userNameForId = function (userId) {
  let usr = Meteor.users.findOne(userId);
  if (usr) {
    let showName = usr.username;
    // If we have a long name for the user: prepend it!
    if (usr.profile?.name && usr.profile.name !== "") {
      showName = usr.profile.name + " (" + showName + ")";
    }
    return showName;
  } else {
    return "Unknown User (" + userId + ")";
  }
};

function countParticipantsMarked() {
  let aMin = new Minutes(_minutesID);
  return aMin.participants.filter((p) => {
    return p.present;
  }).length;
}

function allParticipantsMarked() {
  let aMin = new Minutes(_minutesID);
  return (
    aMin.participants.findIndex((p) => {
      return !p.present;
    }) === -1
  );
}

Template.minutesEditParticipants.onCreated(function () {
  _minutesID = FlowRouter.getParam("_id");
  console.log(
    "Template minutesEditParticipants created with minutesID " + _minutesID,
  );

  this.autorun(() => {
    this.subscribe("onlineUsersForRoute", FlowRouter.current().path);
  });

  // Calculate initial expanded/collapsed state
  Session.set("participants.expand", false);
  if (isEditable()) {
    Session.set("participants.expand", true);
  }
  this.markedAll = new ReactiveVar(allParticipantsMarked());
});

Template.minutesEditParticipants.helpers({
  countParticipantsText() {
    const count = countParticipantsMarked();
    if (count === 1) {
      return i18n.__("Minutes.Participants.solo");
    } else {
      return String(count) + " " + i18n.__("Minutes.Participants.title");
    }
  },

  countAdditionalParticipantsText() {
    let aMin = new Minutes(_minutesID);
    let count = 0;
    if (aMin.participantsAdditional && aMin.participantsAdditional.length > 0) {
      count = aMin.participantsAdditional
        .split(";")
        .map((p) => {
          return p.trim();
        })
        .filter((p) => {
          return p.length > 0;
        }).length;
    }
    if (count === 0) {
      return "";
    }
    if (count === 1) {
      return ", " + i18n.__("Minutes.Participants.additionalSolo");
    }
    return ", " + count + " " + i18n.__("Minutes.Participants.additional");
  },

  countInformedText() {
    let aMin = new Minutes(_minutesID);
    let count = aMin.informedUsers ? aMin.informedUsers.length : 0;
    if (count === 0) {
      return "";
    }
    if (count === 1) {
      return ", " + i18n.__("Minutes.Participants.informedSolo");
    }
    return ", " + count + " " + i18n.__("Minutes.Participants.informed");
  },

  participantsSorted() {
    let aMin = new Minutes(_minutesID);
    let partSorted = aMin.participants;
    partSorted.forEach((p) => {
      p["displayName"] = userNameForId(p.userId);
    });
    partSorted = partSorted.sort(function (a, b) {
      return a.displayName > b.displayName
        ? 1
        : b.displayName > a.displayName
        ? -1
        : 0;
    });
    return partSorted;
  },

  getUserDisplayName(userId) {
    return userNameForId(userId);
  },

  isUserRemotelyConnected(userId) {
    return Boolean(
      OnlineUsersSchema.findOne({
        userId: userId,
        activeRoute: FlowRouter.current().path,
      }),
    );
  },

  isModeratorOfParentSeries(userId) {
    return isModeratorOfParentSeries(userId);
  },

  isParticipantsExpanded() {
    return Session.get("participants.expand");
  },

  collapsedParticipantsNames() {
    let aMin = new Minutes(_minutesID);
    return aMin.getPresentParticipantNames();
  },

  checkedStatePresent() {
    if (this.present) {
      return { checked: "checked" };
    }
    return {};
  },

  disableUIControl() {
    if (isEditable()) {
      return "";
    } else {
      return { disabled: "disabled" };
    }
  },

  hasInformedUsers() {
    let aMin = new Minutes(_minutesID);
    return aMin.informedUsers && aMin.informedUsers.length > 0;
  },

  getInformedUsers() {
    let aMin = new Minutes(_minutesID);
    let informedNames = "";
    if (aMin.informedUsers && aMin.informedUsers.length > 0) {
      aMin.informedUsers.forEach((id) => {
        informedNames = informedNames + userNameForId(id) + ", ";
      });
      informedNames = informedNames.slice(0, -2); // remove last ", "
    }
    return informedNames;
  },

  switch2MultiColumn() {
    let aMin = new Minutes(_minutesID);

    if (aMin.participants.length > 7) {
      return "multicolumn";
    }
  },

  enoughParticipants() {
    let aMin = new Minutes(_minutesID);
    return aMin.participants.length > 2;
  },

  isChecked() {
    return Template.instance().markedAll.get();
  },

  isEditable() {
    return isEditable();
  },

  parentMeetingSeries() {
    let aMin = new Minutes(_minutesID);
    return aMin.parentMeetingSeries();
  },
});

Template.minutesEditParticipants.events({
  "click .js-toggle-present"(evt, tmpl) {
    let min = new Minutes(_minutesID);
    let userId = evt.target.dataset.userid;
    let checkedState = evt.target.checked;
    min.updateParticipantPresent(userId, checkedState);
    tmpl.markedAll.set(allParticipantsMarked());
  },
  "change #edtParticipantsAdditional"(evt, tmpl) {
    let aMin = new Minutes(_minutesID);
    let theParticipant = tmpl.find("#edtParticipantsAdditional").value;
    aMin.update({ participantsAdditional: theParticipant });
  },

  "click #btnParticipantsExpand"() {
    Session.set("participants.expand", !Session.get("participants.expand"));
  },

  "click #btnToggleMarkAllNone"(evt, tmpl) {
    let aMin = new Minutes(_minutesID);
    if (allParticipantsMarked()) {
      aMin.changeParticipantsStatus(false).catch(handleError);
      tmpl.markedAll.set(false);
    } else {
      aMin.changeParticipantsStatus(true).catch(handleError);
      tmpl.markedAll.set(true);
    }
  },

  "click #btnEditParticipants"() {
    Session.set("meetingSeriesEdit.showUsersPanel", true);
  },
});
