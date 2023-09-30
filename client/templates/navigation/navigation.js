import { Template } from "meteor/templating";
import { Meteor } from "meteor/meteor";
import { GlobalSettings } from "/imports/config/GlobalSettings";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { AccountsTemplates } from "meteor/useraccounts:core";
import { IsEditedService } from "../../../imports/services/isEditedService";
import { Session } from "meteor/session";

Template.navigation.helpers({
  logoHTML: function () {
    return GlobalSettings.getBrandingLogoHTML();
  },
  displayUsername() {
    if (Meteor.user().profile && Meteor.user().profile.name) {
      return Meteor.user().profile.name;
    }
    return Meteor.user().username;
  },
});

Template.navigation.events({
  "click li #navbar-signout": function (event) {
    event.preventDefault();
    if (Meteor.userId()) {
      IsEditedService.removeIsEditedOnLogout();

      AccountsTemplates.logout();
      FlowRouter.go("/");
    }
  },

  "click .navbar-brand": function () {
    // When user clicks app logo
    // make sure user sees normal login sub template
    // (and not register / resend...) sub template
    AccountsTemplates.setState("signIn");

    Session.set("gotoMeetingSeriesTab", true);
  },

  "click #navbar-dlgEditProfile": function (evt, tmpl) {
    Session.set("editProfile.userID"); // per default use "current" user. Admin may edit others
    tmpl.$("#dlgEditProfile").modal("show");
  },

  "click #navbar-dlgLocale": function (evt, tmpl) {
    tmpl.$("#dlgLocale").modal("show");
  },
});
