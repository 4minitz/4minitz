import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'


var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesSettings.onCreated(function () {
    _meetingSeriesID = this.data.meetingSeriesId;
    Session.setDefault("currentTab", "meetingSeriesSettingsLabels");
});

Template.meetingSeriesSettings.onRendered(function () {
    let currentTab = (this.data.openTabInviteUsers) ? "" : "meetingSeriesSettingsLabels";
    Session.set("currentTab", currentTab);
});

Template.meetingSeriesSettings.helpers({
    meetingSeries: function() {
        return new MeetingSeries(_meetingSeriesID);
    },


    tab: function() {
        return Session.get("currentTab");
    },

    tabData: function() {
        let tab = Session.get("currentTab");

        switch (tab) {
            case "meetingSeriesSettingsLabels":
                return {
                    meetingSeriesId: _meetingSeriesID
                };
        }
        return {};
    }
});

Template.meetingSeriesSettings.events({
    "click .nav-tabs li": function(event) {
        var currentTab = $(event.target).closest("li");

        currentTab.addClass("active");
        $(".nav-tabs li").not(currentTab).removeClass("active");

        Session.set("currentTab", currentTab.data("template"));
    }
});