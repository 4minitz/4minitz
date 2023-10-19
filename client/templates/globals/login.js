import { GlobalSettings } from "/imports/config/GlobalSettings";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { ReactiveDict } from "meteor/reactive-dict";
import { Template } from "meteor/templating";
import { AccountsTemplates } from "meteor/useraccounts:core";

const ldapEnabled = Meteor.settings.public.ldapEnabled;

Template.login.onCreated(() => {
  const defaultTab = ldapEnabled ? "loginLdap" : "atForm";
  ReactiveDict.setDefault("currentLoginForm", defaultTab);
});

Template.login.onRendered(() => {
  const tab = ldapEnabled ? "loginLdap" : "atForm";
  ReactiveDict.setDefault("currentLoginForm", tab);
});

Template.login.helpers({
  showTabSwitcher() {
    return (
      Meteor.settings.public.ldapEnabled &&
      !Meteor.settings.public.ldapHideStandardLogin
    );
  },

  tab() {
    return ReactiveDict.get("currentLoginForm");
  },

  tabActive(tabFormName) {
    if (ReactiveDict.equals("currentLoginForm", tabFormName)) {
      return "active";
    }
    return "";
  },

  showInfoOnLogin() {
    return !Meteor.userId() && GlobalSettings.showInfoOnLogin();
  },

  showDemoUserHint() {
    return (
      !Meteor.userId() &&
      GlobalSettings.createDemoAccount() &&
      ReactiveDict.get("currentLoginForm") === "atForm" && // only if Standard Login is active
      AccountsTemplates.getState() === "signIn" // only show demo hint on signIn sub-template
    );
  },

  legalNoticeEnabled() {
    return Meteor.settings.public.branding.legalNotice.enabled;
  },
  legalNoticeLinktext() {
    return Meteor.settings.public.branding.legalNotice.linkText;
  },
});

Template.login.events({
  "click .nav-tabs li": function (event) {
    const currentTab = $(event.target).closest("li");

    currentTab.addClass("active");
    $(".nav-tabs li").not(currentTab).removeClass("active");

    ReactiveDict.set("currentLoginForm", currentTab.data("template"));
  },

  "click #btnLegalNotice": function () {
    window.open(GlobalSettings.getLegalNoticeExternalUrl());
  },

  "click #tab_standard": function () {
    AccountsTemplates.setState("signIn");
  },
});
