import "./collections/userroles_private";

import { Roles } from "meteor/alanning:roles";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { i18n } from "meteor/universe:i18n";

import { MeetingSeries } from "./meetingseries";

export class UserRoles {
  constructor(userId /* may be null */, userCollection /* may be null */) {
    this._userId = userId ? userId : Meteor.userId();

    const currentUser = userCollection
      ? userCollection.findOne(this._userId)
      : Meteor.users.findOne(this._userId);

    if (!currentUser) {
      FlowRouter.go("/");
      throw new Meteor.Error(`Could not find user for userId:${this._userId}`);
    }

    this._userRoles = currentUser.roles;
    if (!this._userRoles) {
      this._userRoles = [];
    }
    this._user = currentUser;
  }

  // **************************** STATIC METHODS
  static allRolesNumerical() {
    const rolesNum = [];
    for (const key in UserRoles.USERROLES) {
      rolesNum.push(UserRoles.USERROLES[key]);
    }
    return rolesNum;
  }

  static allRolesNames() {
    // raw role names - not for display!
    return Object.keys(UserRoles.USERROLES);
  }

  // generate I18N Ui text from role value
  // roleValue may be '05' numerical or 'Moderator' role name
  static role2Text(roleValue) {
    if (!isNaN(parseInt(roleValue))) {
      // numerical '01'
      for (const userrolesKey in UserRoles.USERROLES) {
        if (UserRoles.USERROLES[userrolesKey] === roleValue) {
          roleValue = userrolesKey;
        }
      }
    }
    // !!! Keep these comments for tests/i18n/test_i18n_resources.js
    // i18n.__('UserRoles.roleModerator')  // comment avoids non-used warnings,
    // and forces error if they miss i18n.__('UserRoles.roleUploader')  //
    // comment avoids non-used warnings, and forces error if they miss
    // i18n.__('UserRoles.roleInvited')  // comment avoids non-used warnings,
    // and forces error if they miss i18n.__('UserRoles.roleInformed')  //
    // comment avoids non-used warnings, and forces error if they miss
    return i18n.__(`UserRoles.role${roleValue}`);
  }

  static removeAllRolesFor(aMeetingSeriesID) {
    const ms = new MeetingSeries(aMeetingSeriesID);
    const affectedUsers = ms.visibleFor;
    if (affectedUsers && affectedUsers.length > 0) {
      Roles.removeUsersFromRoles(
        affectedUsers,
        UserRoles.allRolesNumerical(),
        aMeetingSeriesID,
      );
    }
  }

  static isVisibleRole(aRole) {
    return aRole <= UserRoles.USERROLES.Invited;
  }

  // **************************** METHODS

  // generate list of visible meeting series for a specific user
  visibleMeetingSeries() {
    const visibleMeetingsSeries = [];
    for (const aMeetingSeriesID in this._userRoles) {
      if (this.hasViewRoleFor(aMeetingSeriesID)) {
        visibleMeetingsSeries.push(aMeetingSeriesID);
      }
    }
    return visibleMeetingsSeries;
  }

  isModeratorOf(aMeetingSeriesID) {
    const currentRole = this.currentRoleFor(aMeetingSeriesID);
    return currentRole && currentRole <= UserRoles.USERROLES.Moderator;
  }

  isUploaderFor(aMeetingSeriesID) {
    const currentRole = this.currentRoleFor(aMeetingSeriesID);
    return currentRole && currentRole <= UserRoles.USERROLES.Uploader;
  }

  isInvitedTo(aMeetingSeriesID) {
    const currentRole = this.currentRoleFor(aMeetingSeriesID);
    return currentRole && currentRole <= UserRoles.USERROLES.Invited;
  }

  isInformedAbout(aMeetingSeriesID) {
    const currentRole = this.currentRoleFor(aMeetingSeriesID);
    return currentRole && currentRole <= UserRoles.USERROLES.Informed;
  }

  hasViewRoleFor(aMeetingSeriesID) {
    return this.isInvitedTo(aMeetingSeriesID) /* or lower access role */;
  }

  currentRoleFor(aMeetingSeriesID) {
    if (
      !this._userRoles[aMeetingSeriesID] ||
      !this._userRoles[aMeetingSeriesID][0]
    ) {
      return undefined;
    }
    return this._userRoles[aMeetingSeriesID][0];
  }

  currentRoleTextFor(aMeetingSeriesID) {
    if (
      this._userRoles[aMeetingSeriesID] &&
      this._userRoles[aMeetingSeriesID].length > 0
    ) {
      // use only the first role element from the array
      return UserRoles.role2Text(this._userRoles[aMeetingSeriesID][0]);
    }
    return "Unknown Role";
  }

  getUser() {
    return this._user;
  }

  getUserID() {
    return this._userId;
  }

  saveRoleForMeetingSeries(aMeetingSeriesID, newRole) {
    Meteor.call(
      "userroles.saveRoleForMeetingSeries",
      this._userId,
      aMeetingSeriesID,
      newRole,
    );
  }

  // remove all roles for the current user for the given meeting series
  removeAllRolesForMeetingSeries(aMeetingSeriesID) {
    Meteor.call(
      "userroles.removeAllRolesForMeetingSeries",
      this._userId,
      aMeetingSeriesID,
    );
  }
}

// #Security:
// Make sure the values of this enum are string-sortable
// and lower values have higher access rights!
// So, prefix zeroes are important!
UserRoles.USERROLES = {
  Moderator: "01", // Attention: the role names are not used for display! Use
  // role2Text for UI!
  Uploader: "05",
  Invited: "10",
  Informed: "66",
};
