import { GlobalSettings } from "/imports/config/GlobalSettings";
import { Meteor } from "meteor/meteor";
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { Template } from "meteor/templating";

const showStatistics = new ReactiveVar(false);

Template.aboutDialog.onRendered(() => {});

Template.aboutDialog.helpers({
  gitVersionInfo() {
    return Session.get("gitVersionInfo");
  },

  currentYear() {
    return new Date().getFullYear();
  },

  displayStatistics() {
    return showStatistics.get();
  },

  legalNoticeEnabled() {
    return Meteor.settings.public.branding.legalNotice.enabled;
  },
  legalNoticeLinktext() {
    return Meteor.settings.public.branding.legalNotice.linkText;
  },
});

Template.aboutDialog.events({
  "click #about-4minitz-logo": function () {
    showStatistics.set(!showStatistics.get());
  },

  "click #btnLegalNotice": function () {
    $("#dlgAbout").modal("hide");
    $(".modal-backdrop").remove(); // The backdrop was sticky - we remove it manually...
    window.open(GlobalSettings.getLegalNoticeExternalUrl());
  },

  "show.bs.modal #dlgAbout": function () {
    Meteor.call("gitVersionInfo", (error, result) => {
      if (error) {
        console.log(`err:${error}`);
      } else {
        Session.set("gitVersionInfo", result);
      }
    });
  },
});
