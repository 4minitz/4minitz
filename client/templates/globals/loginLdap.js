import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { FlashMessage } from "/client/helpers/flashMessage";
import $ from "jquery";

function loginCallback(error) {
  if (error) {
    console.error("An error occurred while trying to log in:", error);
    new FlashMessage(i18n.__("Login.Error.title"), error.message).show();
  }

  const routeName = FlowRouter.current().route.name;
  if (routeName === "signup" || routeName === "home") {
    FlowRouter.go("home");
  }
}

Template.loginLdap.helpers({
  LDAPLabel4Username() {
    return Meteor.settings.public.ldapLabel4Username;
  },
  LDAPLabel4Password() {
    return Meteor.settings.public.ldapLabel4Password;
  },
});

// Username
// Password
Template.loginLdap.events({
  "submit #ldapLoginForm"(event) {
    event.preventDefault();

    const username = $("#id_ldapUsername").val();
    const password = $("#id_ldapPassword").val();

    Meteor.loginWithLdap(username, password, loginCallback);
  },
});
