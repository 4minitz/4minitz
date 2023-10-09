import { GlobalSettings } from "/imports/config/GlobalSettings";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveDict } from "meteor/reactive-dict";
import { Template } from "meteor/templating";
import { AccountsTemplates } from "meteor/useraccounts:core";

import { IsEditedService } from "../../../imports/services/isEditedService";

Template.navigation.helpers({
  logoHTML() {
    return GlobalSettings.getBrandingLogoHTML();
  },
  displayUsername() {
    if (Meteor.user().profile?.name) {
      return Meteor.user().profile.name;
    }
    return Meteor.user().username;
  },
});

Template.navigation.events({
  "click li #navbar-signout": function (event) {
    event.preventDefault();
    if (!Meteor.userId()) {
      return;
    }
    IsEditedService.removeIsEditedOnLogout();

    AccountsTemplates.logout();
    FlowRouter.go("/");
  },

  "click .navbar-brand": function () {
    // When user clicks app logo
    // make sure user sees normal login sub template
    // (and not register / resend...) sub template
    AccountsTemplates.setState("signIn");

    ReactiveDict.set("gotoMeetingSeriesTab", true);
  },

  "click #navbar-dlgEditProfile": function (evt, tmpl) {
    ReactiveDict.set("editProfile.userID"); // per default use "current" user.
    // Admin may edit others

    tmpl.$("#dlgEditProfile").modal("show");
  },

  "click #navbar-dlgLocale": function (evt, tmpl) {
    tmpl.$("#dlgLocale").modal("show");
  },
});
