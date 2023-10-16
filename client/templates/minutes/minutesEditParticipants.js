import "/imports/collections/onlineusers_private";

import { handleError } from "/client/helpers/handleError";
import { OnlineUsersSchema } from "/imports/collections/onlineusers.schema";
import { Minutes } from "/imports/minutes";
import { UserRoles } from "/imports/userroles";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

let _minutesID; // the ID of these minutes

const isEditable = () => {
  const min = new Minutes(_minutesID);
  return min.isCurrentUserModerator() && !min.isFinalized;
};

const isModeratorOfParentSeries = (userId) => {
  const aMin = new Minutes(_minutesID);
  const usrRole = new UserRoles(userId);
  return usrRole.isModeratorOf(aMin.parentMeetingSeriesID());
};

const userNameForId = (userId) => {
  const usr = Meteor.users.findOne(userId);
  if (usr) {
    const showName = usr.username;
    // If we have a long name for the user: prepend it!
    if (usr.profile?.name && usr.profile.name !== "") {
      return `${usr.profile.name} (${showName})`;
    }
    return showName;
  } else {
    return `Unknown User (${userId})`;
  }
};

function countParticipantsMarked() {
  const aMin = new Minutes(_minutesID);
  return aMin.participants.filter((p) => {
    return p.present;
  }).length;
}

function allParticipantsMarked() {
  const aMin = new Minutes(_minutesID);
  return (
    aMin.participants.findIndex((p) => {
      return !p.present;
    }) === -1
  );
}

Template.minutesEditParticipants.onCreated(function () {
  _minutesID = FlowRouter.getParam("_id");
  console.log(
    `Template minutesEditParticipants created with minutesID ${_minutesID}`,
  );

  this.autorun(() => {
    this.subscribe("onlineUsersForRoute", FlowRouter.current().path);
  });

  // Calculate initial expanded/collapsed state
  ReactiveDict.set("participants.expand", false);
  if (isEditable()) {
    ReactiveDict.set("participants.expand", true);
  }
  this.markedAll = new ReactiveVar(allParticipantsMarked());
});

Template.minutesEditParticipants.helpers({
  countParticipantsText() {
    const count = countParticipantsMarked();
    return count === 1
      ? i18n.__("Minutes.Participants.solo")
      : `${String(count)} ${i18n.__("Minutes.Participants.title")}`;
  },

  countAdditionalParticipantsText() {
    const aMin = new Minutes(_minutesID);
    const count =
      aMin.participantsAdditional && aMin.participantsAdditional.length > 0
        ? aMin.participantsAdditional
            .split(";")
            .map((p) => {
              return p.trim();
            })
            .filter((p) => {
              return p.length > 0;
            }).length
        : 0;
    if (count === 0) {
      return "";
    }
    if (count === 1) {
      return `, ${i18n.__("Minutes.Participants.additionalSolo")}`;
    }
    return `, ${count} ${i18n.__("Minutes.Participants.additional")}`;
  },

  countInformedText() {
    const aMin = new Minutes(_minutesID);
    const count = aMin.informedUsers ? aMin.informedUsers.length : 0;
    if (count === 0) {
      return "";
    }
    if (count === 1) {
      return `, ${i18n.__("Minutes.Participants.informedSolo")}`;
    }
    return `, ${count} ${i18n.__("Minutes.Participants.informed")}`;
  },

  participantsSorted() {
    const aMin = new Minutes(_minutesID);
    const partSorted = aMin.participants;
    partSorted.forEach((p) => {
      p.displayName = userNameForId(p.userId);
    });
    return partSorted.sort((a, b) =>
      a.displayName > b.displayName
        ? 1
        : b.displayName > a.displayName
        ? -1
        : 0,
    );
  },

  getUserDisplayName(userId) {
    return userNameForId(userId);
  },

  isUserRemotelyConnected(userId) {
    return Boolean(
      OnlineUsersSchema.findOne({
        userId,
        activeRoute: FlowRouter.current().path,
      }),
    );
  },

  isModeratorOfParentSeries(userId) {
    return isModeratorOfParentSeries(userId);
  },

  isParticipantsExpanded() {
    return ReactiveDict.get("participants.expand");
  },

  collapsedParticipantsNames() {
    const aMin = new Minutes(_minutesID);
    return aMin.getPresentParticipantNames();
  },

  checkedStatePresent() {
    if (this.present) {
      return { checked: "checked" };
    }
    return {};
  },

  disableUIControl() {
    return isEditable() ? "" : { disabled: "disabled" };
  },

  hasInformedUsers() {
    const aMin = new Minutes(_minutesID);
    return aMin.informedUsers && aMin.informedUsers.length > 0;
  },

  getInformedUsers() {
    const aMin = new Minutes(_minutesID);
    let informedNames = "";
    if (aMin.informedUsers && aMin.informedUsers.length > 0) {
      aMin.informedUsers.forEach((id) => {
        informedNames = `${informedNames + userNameForId(id)}, `;
      });
      return informedNames.slice(0, -2);
    }
    return informedNames;
  },

  switch2MultiColumn() {
    const aMin = new Minutes(_minutesID);

    if (aMin.participants.length > 7) {
      return "multicolumn";
    }
  },

  enoughParticipants() {
    const aMin = new Minutes(_minutesID);
    return aMin.participants.length > 2;
  },

  isChecked() {
    return Template.instance().markedAll.get();
  },

  isEditable() {
    return isEditable();
  },

  parentMeetingSeries() {
    const aMin = new Minutes(_minutesID);
    return aMin.parentMeetingSeries();
  },
});

Template.minutesEditParticipants.events({
  "click .js-toggle-present"(evt, tmpl) {
    const min = new Minutes(_minutesID);
    const userId = evt.target.dataset.userid;
    const checkedState = evt.target.checked;
    min.updateParticipantPresent(userId, checkedState);
    tmpl.markedAll.set(allParticipantsMarked());
  },
  "change #edtParticipantsAdditional"(evt, tmpl) {
    const aMin = new Minutes(_minutesID);
    const theParticipant = tmpl.find("#edtParticipantsAdditional").value;
    aMin.update({ participantsAdditional: theParticipant });
  },

  "click #btnParticipantsExpand"() {
    ReactiveDict.set(
      "participants.expand",
      !ReactiveDict.get("participants.expand"),
    );
  },

  "click #btnToggleMarkAllNone"(evt, tmpl) {
    const aMin = new Minutes(_minutesID);
    if (allParticipantsMarked()) {
      aMin.changeParticipantsStatus(false).catch(handleError);
      tmpl.markedAll.set(false);
    } else {
      aMin.changeParticipantsStatus(true).catch(handleError);
      tmpl.markedAll.set(true);
    }
  },

  "click #btnEditParticipants"() {
    ReactiveDict.set("meetingSeriesEdit.showUsersPanel", true);
  },
});
