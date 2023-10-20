import { Meteor } from "meteor/meteor";
import { ReactiveDict } from "meteor/reactive-dict";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { GlobalSettings } from "/imports/config/GlobalSettings";

const showStatistics = new ReactiveVar(false);

Template.aboutDialog.onRendered(() => {});

Template.aboutDialog.helpers({
  gitVersionInfo() {
    return ReactiveDict.get("gitVersionInfo");
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
        console.error(`err:${error}`);
      } else {
        ReactiveDict.set("gitVersionInfo", result);
      }
    });
  },
});
