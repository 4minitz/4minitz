import { UserRoles } from "/imports/userroles";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import { addCustomValidator } from "../../helpers/customFieldValidator";

import {
  addNewUser,
  checkUserName,
  userlistClean,
} from "./meetingSeriesEditUsersHelpers";

let _config; // of type: UsersEditConfig

export class UsersEditConfig {
  constructor(currentUserReadOnly, meetingSeriesID, users) {
    this.currentUserReadOnly = currentUserReadOnly;
    this.meetingSeriesID = meetingSeriesID;
    this.users = users;
  }
}

Template.meetingSeriesEditUsers.onCreated(function () {
  _config = this.data; // UsersEditConfig object
});

Template.meetingSeriesEditUsers.onRendered(() => {
  Meteor.typeahead.inject();

  addCustomValidator(
    "#edt_AddUser",
    (value) => {
      if (value === "") {
        return false;
      }
      return checkUserName(value, _config);
    },
    "",
  );
});

Template.meetingSeriesEditUsers.helpers({
  userListClean() {
    return userlistClean(
      Meteor.users.find({ isInactive: { $not: true } }).fetch(),
      _config.users.find().fetch(),
    );
  },

  users() {
    return _config.users.find({}, { sort: { username: 1 } });
  },

  userRoleObj(userID) {
    // get user with roles from temp. user collection, not the global meteor
    // user collection!
    return new UserRoles(userID, _config.users);
  },

  hasViewRole() {
    // this is blaze context {{# with userRoleObj currentuser._id}}
    // So, this is a UserRoles object
    return this.hasViewRoleFor(_config.meetingSeriesID);
  },

  currentRole() {
    // this is blaze context {{# with userRoleObj currentuser._id}}
    // So, this is a UserRoles object
    return this.currentRoleTextFor(_config.meetingSeriesID);
  },

  isModerator() {
    // this is blaze context {{# with userRoleObj currentuser._id}}
    // So, this is a UserRoles object
    return this.isModeratorOf(_config.meetingSeriesID);
  },

  // the currently logged in user shall not be able to edit herself.
  // Eg. logged in user shall not change herself Moderator => Invited
  // or currently logged in user shall not be able to delete herself from list
  userIsReadOnly() {
    return _config.currentUserReadOnly && this._user._idOrg === Meteor.userId();
  },

  // generate the "<select>" HTML with possible roles and the
  // role selected that is currently attached to the user
  rolesOptions() {
    // this is blaze context {{# with userRoleObj currentuser._id}}
    // So, this is a UserRoles object
    const currentRoleNum = this.currentRoleFor(_config.meetingSeriesID);
    const userName = this.getUser().username;
    let rolesHTML =
      '<select id="roleSelect' +
      userName +
      '" class="form-control user-role-select">';
    const rolesNames = UserRoles.allRolesNames();
    const rolesNums = UserRoles.allRolesNumerical();
    for (const i in rolesNames) {
      const roleNum = rolesNums[i];
      const roleName = rolesNames[i];
      let startTag = `<option value='${roleName}'>`;
      if (roleNum === currentRoleNum) {
        startTag = `<option value="${roleName}" selected="selected">`;
      }
      rolesHTML += `${startTag + UserRoles.role2Text(roleNum)}</option>`;
    }
    rolesHTML += "</select>";
    return rolesHTML;
  },

  displayUsername(userObj) {
    if (userObj.profile?.name) {
      return `${userObj.profile.name} (${userObj.username})`;
    }
    return userObj.username;
  },
});

Template.meetingSeriesEditUsers.events({
  "click #btnDeleteUser": function (evt) {
    evt.preventDefault();
    _config.users.remove({ _id: this._userId });
  },

  // when role select changes, update role in temp. client-only user collection
  "change .user-role-select": function (evt) {
    const roleName = $(evt.target).val();
    const roleValue = UserRoles.USERROLES[roleName];

    const changedUser = _config.users.findOne(this._userId);
    changedUser.roles[_config.meetingSeriesID] = [roleValue];
    _config.users.update(this._userId, { $set: { roles: changedUser.roles } });
  },

  "submit #form-add-user": function (evt, tmpl) {
    evt.preventDefault();
    const newUserName = tmpl.find("#edt_AddUser").value;
    addNewUser(newUserName, _config);

    $(".typeahead").typeahead("val", "").typeahead("close");
  },

  "keyup #edt_AddUser": function (evt, tmpl) {
    if (evt.which === 13) {
      // 'ENTER' on username <input>
      evt.stopPropagation();
      evt.preventDefault();

      tmpl.$("#form-add-user").find(":submit").click();

      return false;
    }
    if (evt.which !== 27) {
      return;
    }
    // 'ESC' on username <input>
    evt.stopPropagation();
    evt.preventDefault();
    $(".typeahead").typeahead("val", "").typeahead("close");
    return false;
  },

  // a typeahead suggestion was selected from drop-down menu
  "typeahead:select": function (evt, tmpl, selected) {
    const newUserName = selected.value.toString();
    $(".typeahead").typeahead("val", "");
    addNewUser(newUserName, _config);
  },
});
