import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import ReactiveDict from "meteor/reactive-dict";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";

const rememberLastTab = (tmpl) => {
  ReactiveDict.set("home.lastTab", {
    tabId: tmpl.activeTabId.get(),
    tabTemplate: tmpl.activeTabTemplate.get(),
  });
};

Template.home.onCreated(function () {
  // Did another view request to restore the last tab on this view?
  if (ReactiveDict.equals("restoreTabAfterBackButton", "home.lastTab")) {
    this.activeTabId = new ReactiveVar(ReactiveDict.get("home.lastTab").tabId);
    this.activeTabTemplate = new ReactiveVar(
      ReactiveDict.get("home.lastTab").tabTemplate,
    );
    ReactiveDict.set("restoreTabAfterBackButton", false);
  } else {
    this.activeTabId = new ReactiveVar("tab_meetings");
    this.activeTabTemplate = new ReactiveVar("meetingSeriesList");
    rememberLastTab(this);
  }

  this.seriesReady = new ReactiveVar();

  this.autorun(() => {
    this.subscribe("meetingSeriesOverview");
    this.seriesReady.set(this.subscriptionsReady());
  });
});

Template.home.helpers({
  authenticating() {
    const subscriptionReady = Template.instance().seriesReady.get();
    return Meteor.loggingIn() || !subscriptionReady;
  },
  isTabActive(tabId) {
    return Template.instance().activeTabId.get() === tabId ? "active" : "";
  },

  tab() {
    const meetingSeriesTab = ReactiveDict.get("gotoMeetingSeriesTab");
    if (meetingSeriesTab) {
      Template.instance().activeTabId.set("tab_meetings");
      Template.instance().activeTabTemplate.set("meetingSeriesList");
      ReactiveDict.set("gotoMeetingSeriesTab", false);
      return;
    }
    return Template.instance().activeTabTemplate.get();
  },
});

Template.home.events({
  "click .nav-tabs li": function (event, tmpl) {
    const currentTab = $(event.target).closest("li");

    tmpl.activeTabId.set(currentTab.attr("id"));
    tmpl.activeTabTemplate.set(currentTab.data("template"));
    rememberLastTab(tmpl);
  },
});
