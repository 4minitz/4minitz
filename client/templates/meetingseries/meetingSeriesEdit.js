import { handleError } from "/client/helpers/handleError";
import { MeetingSeries } from "/imports/meetingseries";
import { Minutes } from "/imports/minutes";
import { UserRoles } from "/imports/userroles";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveDict } from "meteor/reactive-dict";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { IsEditedService } from "../../../imports/services/isEditedService";
import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";
import { isEditedHandling } from "../../helpers/isEditedHelpers";

import { UsersEditConfig } from "./meetingSeriesEditUsers";

Template.meetingSeriesEdit.onCreated(function () {
  let thisMeetingSeriesID = FlowRouter.getParam("_id");
  // Check if this dialog was not called by a meetingseries but by a minute
  if (!MeetingSeries.findOne(thisMeetingSeriesID))
    thisMeetingSeriesID =
      Minutes.findOne(thisMeetingSeriesID).parentMeetingSeriesID();

  // create client-only collection for storage of users attached
  // to this meeting series as input <=> output for the user editor
  const _attachedUsersCollection = new Mongo.Collection(null);

  // build editor config and attach it to the instance of the template
  this.userEditConfig = new UsersEditConfig(
    true, // current user can not be edited
    thisMeetingSeriesID, // the meeting series id
    _attachedUsersCollection,
  ); // collection of attached users
  // Hint: collection will be filled in the "show.bs.modal" event below
});

Template.meetingSeriesEdit.helpers({
  users() {
    return Meteor.users.find({});
  },

  userEditConfig() {
    return Template.instance().userEditConfig;
  },

  labelsConfig() {
    return {
      meetingSeriesId: this._id,
    };
  },
});

// This function handles notification on role changes if the
// moderator checked the according check box in the meeting series editor
// It does so by comparing the users & roles before and after usage of the
// editor.
const notifyOnRoleChange = function (usersWithRolesAfterEdit, meetingSeriesId) {
  function sendEmail(userId, oldRole, newRole, meetingSeriesId) {
    Meteor.call(
      "meetingseries.sendRoleChange",
      userId,
      oldRole,
      newRole,
      meetingSeriesId,
    );
  }

  const usersBeforeEdit = this.visibleFor.concat(this.informedUsers);
  const usersWithRolesAfterEditForEmails = usersWithRolesAfterEdit.slice();
  const moderator = new UserRoles(Meteor.userId());

  for (const i in usersBeforeEdit) {
    const oldUserId = usersBeforeEdit[i];
    const oldUserWithRole = new UserRoles(oldUserId);
    const oldUserRole = oldUserWithRole.currentRoleFor(meetingSeriesId);

    // Search in after edit users whether the users still exists
    const matchingUser = usersWithRolesAfterEditForEmails.find(
      (user) => oldUserWithRole._userId === user._idOrg,
    );

    // If he does not, his role was removed
    if (matchingUser === undefined) {
      if (oldUserWithRole._userId !== moderator._userId) {
        sendEmail(
          oldUserWithRole.getUser()._id,
          oldUserRole,
          undefined,
          meetingSeriesId,
        );
      }
    } else {
      const newUserWithRole = new UserRoles(matchingUser._idOrg);
      const newUserRole = matchingUser.roles[meetingSeriesId][0];
      const index = usersWithRolesAfterEditForEmails.indexOf(matchingUser);

      // Roles have changed
      if (newUserRole !== oldUserRole) {
        sendEmail(
          newUserWithRole.getUser()._id,
          oldUserRole,
          newUserRole,
          meetingSeriesId,
        );
      }
      usersWithRolesAfterEditForEmails.splice(index, 1);
    }
  }
  // The remaining users in the after-edit-array -> got added
  for (const i in usersWithRolesAfterEditForEmails) {
    const newUser = usersWithRolesAfterEditForEmails[i];
    const newUserRole = newUser.roles[meetingSeriesId][0];
    if (moderator._userId !== newUser._idOrg) {
      sendEmail(newUser._idOrg, undefined, newUserRole, meetingSeriesId);
    }
  }
};

Template.meetingSeriesEdit.events({
  "click #deleteMeetingSeries": function () {
    console.log(`Remove Meeting Series: ${this._id}`);
    $("#dlgEditMeetingSeries").modal("hide"); // hide underlying modal dialog first, otherwise
    // transparent modal layer is locked!

    const ms = new MeetingSeries(this._id);

    const deleteSeriesCallback = () => {
      MeetingSeries.remove(ms).catch(handleError);
      FlowRouter.go("/");
    };

    const confirmationDialog =
      ConfirmationDialogFactory.makeWarningDialogWithTemplate(
        deleteSeriesCallback,
        i18n.__("MeetingSeries.Edit.confirmDelete"),
        "confirmationDialogDeleteSeries",
        {
          project: ms.project,
          name: ms.name,
          hasMinutes: ms.minutes.length !== 0,
          minutesCount: ms.minutes.length,
          lastMinutesDate: ms.minutes.length === 0 ? false : ms.lastMinutesDate,
        },
      );

    Meteor.defer(() => {
      confirmationDialog.show();
    });
  },

  // "show" event is fired shortly before BootStrap modal dialog will pop up
  // We fill the temp. client-side only user database for the user editor on
  // this event
  "show.bs.modal #dlgEditMeetingSeries": function (evt, tmpl) {
    const ms = new MeetingSeries(tmpl.data._id);

    const unset = () => {
      IsEditedService.removeIsEditedMeetingSerie(ms._id, true);
      $("#dlgEditMeetingSeries").modal("show");
    };
    const setIsEdited = () => {
      IsEditedService.setIsEditedMeetingSerie(ms._id);
    };

    isEditedHandling(
      ms,
      unset,
      setIsEdited,
      evt,
      "confirmationDialogResetEdit",
    );

    // Make sure these init values are filled in a close/re-open scenario
    $("#btnMeetingSeriesSave").prop("disabled", false);
    $("#btnMeetinSeriesEditCancel").prop("disabled", false);
    tmpl.find("#id_meetingproject").value = this.project;
    tmpl.find("#id_meetingname").value = this.name;

    Template.instance().userEditConfig.users.remove({}); // first: clean up everything!

    // copy all attached users of this series to the temp. client-side user
    // collection and save their original _ids for later reference
    for (const i in this.visibleFor) {
      const user = Meteor.users.findOne(this.visibleFor[i]);
      user._idOrg = user._id;
      delete user._id;
      Template.instance().userEditConfig.users.insert(user);
    }
    // now the same for the informed users
    for (const i in this.informedUsers) {
      const user = Meteor.users.findOne(this.informedUsers[i]);
      user._idOrg = user._id;
      delete user._id;
      Template.instance().userEditConfig.users.insert(user);
    }
  },

  "shown.bs.modal #dlgEditMeetingSeries": function (evt, tmpl) {
    // switch to "invited users" tab once, if desired
    if (ReactiveDict.equals("meetingSeriesEdit.showUsersPanel", true)) {
      ReactiveDict.set("meetingSeriesEdit.showUsersPanel", false);
      $("#btnShowHideInvitedUsers").click();
      Meteor.setTimeout(() => {
        tmpl.find("#edt_AddUser").focus();
      }, 500);
      return;
    }
    $("#dlgEditMeetingSeries input").trigger("change"); // ensure new values trigger placeholder animation
    tmpl.find("#id_meetingproject").focus();
  },

  "submit #frmDlgEditMeetingSeries": function (evt, tmpl) {
    evt.preventDefault();
    const saveButton = $("#btnMeetingSeriesSave");
    const cancelButton = $("btnMeetinSeriesEditCancel");
    saveButton.prop("disabled", true);
    cancelButton.prop("disabled", true);

    const aProject = tmpl.find("#id_meetingproject").value;
    const aName = tmpl.find("#id_meetingname").value;
    const modWantsNotifyOnRoleChange = tmpl.find("#checkBoxRoleChange").checked;

    // validate form and show errors - necessary for browsers which do not
    // support form-validation
    const projectNode = tmpl.$("#id_meetingproject");
    const nameNode = tmpl.$("#id_meetingname");
    projectNode.parent().removeClass("has-error");
    nameNode.parent().removeClass("has-error");
    if (aProject === "") {
      projectNode.parent().addClass("has-error");
      projectNode.focus();
      return;
    }
    if (aName === "") {
      nameNode.parent().addClass("has-error");
      nameNode.focus();
      return;
    }

    const usersWithRolesAfterEdit = Template.instance()
      .userEditConfig.users.find()
      .fetch();
    const allVisiblesArray = [];
    const allInformedArray = [];
    const meetingSeriesId = this._id;

    if (modWantsNotifyOnRoleChange) {
      notifyOnRoleChange.call(this, usersWithRolesAfterEdit, meetingSeriesId);
    }

    for (const i in usersWithRolesAfterEdit) {
      const usrAfterEdit = usersWithRolesAfterEdit[i];
      const newRole = new UserRoles(usrAfterEdit._idOrg); // Attention: get back to Id of Meteor.users collection

      newRole.saveRoleForMeetingSeries(
        meetingSeriesId,
        usrAfterEdit.roles[meetingSeriesId],
      );
      if (UserRoles.isVisibleRole(usrAfterEdit.roles[meetingSeriesId])) {
        allVisiblesArray.push(usrAfterEdit._idOrg); // Attention: get back to Id of Meteor.users
        // collection
      } else {
        allInformedArray.push(usrAfterEdit._idOrg); // Attention: get back to Id of Meteor.users
        // collection
      }
    }

    const ms = new MeetingSeries(meetingSeriesId);
    ms.project = aProject;
    ms.name = aName;
    ms.setVisibleAndInformedUsers(allVisiblesArray, allInformedArray); // this also removes the roles of removed users
    ms.save();
    IsEditedService.removeIsEditedMeetingSerie(ms._id, true);

    // Hide modal dialog
    saveButton.prop("disabled", false);
    cancelButton.prop("disabled", false);
    $("#dlgEditMeetingSeries").modal("hide");
  },

  "click #btnMeetingSeriesSave": function (evt, tmpl) {
    evt.preventDefault();
    // Unfortunately the form.submit()-function does not trigger the
    // validation process
    tmpl.$("#submitMeetingSeriesEditForm").click();
  },

  "click #btnMeetinSeriesEditCancel,#btnEditMSClose": function (evt, tmpl) {
    evt.preventDefault();

    const ms = new MeetingSeries(tmpl.data._id);
    IsEditedService.removeIsEditedMeetingSerie(ms._id, false);

    $("#dlgEditMeetingSeries").modal("hide");
  },

  keyup(evt, tmpl) {
    evt.preventDefault();
    if (evt.keyCode !== 27) {
      return;
    }
    const ms = new MeetingSeries(tmpl.data._id);
    IsEditedService.removeIsEditedMeetingSerie(ms._id, false);

    $("#dlgEditMeetingSeries").modal("hide");
  },

  // Prevent the last open panel to be collapsible
  "click .panel-heading a": function (evt) {
    if (
      $(evt.target).parents(".panel").children(".panel-collapse").hasClass("in")
    ) {
      evt.stopPropagation();
    }
    evt.preventDefault();
  },
});
