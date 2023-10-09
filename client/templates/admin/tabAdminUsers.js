import { OnlineUsersSchema } from "/imports/collections/onlineusers.schema";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

const _filterUsers = new ReactiveVar("");
const _showInactive = new ReactiveVar(false);
const _showOnline = new ReactiveVar(false);
const _visibleCount = new ReactiveVar(0);

Template.tabAdminUsers.onCreated(function () {
  this.autorun(() => {
    this.subscribe("onlineUsersForRoute");
  });
});

Template.tabAdminUsers.onRendered(() => {
  _filterUsers.set("");
  Template.instance().find("#id_adminFilterUsers").focus();
  Template.instance().find("#id_adminShowInactive").checked =
    _showInactive.get();
});

Template.tabAdminUsers.helpers({
  users() {
    const filterString = _filterUsers.get();
    let filterOptions =
      filterString.length > 0
        ? {
            $or: [
              { username: { $regex: filterString, $options: "i" } },
              { "profile.name": { $regex: filterString, $options: "i" } },
              { "emails.0.address": { $regex: filterString, $options: "i" } },
              { _id: { $regex: filterString, $options: "i" } },
            ],
          }
        : {};
    if (!_showInactive.get()) {
      filterOptions = { $and: [{ isInactive: { $not: true } }, filterOptions] };
    }
    if (_showOnline.get()) {
      const onlineusers = OnlineUsersSchema.find()
        .fetch()
        .map((ousr) => {
          return ousr.userId;
        });
      filterOptions = { $and: [{ _id: { $in: onlineusers } }, filterOptions] };
    }

    const userCursor = Meteor.users.find(filterOptions, {
      sort: { username: 1 },
      limit: 250,
    });
    _visibleCount.set(userCursor.count());
    return userCursor;
  },

  inactiveStateText(user) {
    if (user.isInactive) {
      return i18n.__("Admin.Users.State.inactive");
    }
    return i18n.__("Admin.Users.State.active");
  },
  inactiveStateColor(user) {
    if (user.isInactive) {
      return "#ffced9";
    }
    return "#A2F9EA";
  },

  email(user) {
    if (user.emails && user.emails.length > 0) {
      return user.emails[0].address;
    }
    return "";
  },

  userCount() {
    const userCountAll = _showInactive.get()
      ? Meteor.users.find({}).count()
      : Meteor.users.find({ isInactive: { $not: true } }).count();
    const userCountVisible = _visibleCount.get() + 0;

    if (userCountVisible === 1) {
      return i18n.__("Admin.Users.countSingle", {
        visible: userCountVisible,
        all: userCountAll,
      });
    }
    return i18n.__("Admin.Users.count", {
      visible: userCountVisible,
      all: userCountAll,
    });
  },
});

Template.tabAdminUsers.events({
  "keyup #id_adminFilterUsers"(evt, tmpl) {
    const filterString = tmpl.find("#id_adminFilterUsers").value;
    _filterUsers.set(filterString);
  },

  "click #id_ToggleInactive"(evt) {
    evt.preventDefault();
    Meteor.call("users.admin.ToggleInactiveUser", this._id);
  },

  "click #id_EditUserProfile"(evt) {
    evt.preventDefault();
    ReactiveDict.set("editProfile.userID", this._id);
    $("#dlgEditProfile").modal("show");
  },

  "change #id_adminShowInactive"(evt, tmpl) {
    _showInactive.set(tmpl.find("#id_adminShowInactive").checked);
  },

  "change #id_adminShowOnline"(evt, tmpl) {
    _showOnline.set(tmpl.find("#id_adminShowOnline").checked);
  },
});
