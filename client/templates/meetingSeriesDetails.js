import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'


var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    _meetingSeriesID = this.data;
    Session.setDefault("currentTab", "minutesList");
});

Template.meetingSeriesDetails.onRendered(function () {
    Session.set("currentTab", "minutesList");
});

Template.meetingSeriesDetails.onRendered(function () {
    $.material.init();
});

Template.meetingSeriesDetails.helpers({
    errorTitle: function() {
        let title = Session.get("errorTitle");

        if (title) {
            setTimeout(() => {
                Session.set("errorTitle", false);
            }, 3000);
        }

        return title;
    },

    errorMessage: function () {
        return Session.get("errorReason");
    },

    meetingSeries: function() {
        return new MeetingSeries(_meetingSeriesID);
    },

    minutes: function() {
        let ms = new MeetingSeries(_meetingSeriesID);
        return ms.getAllMinutes();
    },

    tab: function() {
        return Session.get("currentTab");
    },

    tabData: function() {
        let tab = Session.get("currentTab");
        let ms = new MeetingSeries(_meetingSeriesID);

        switch (tab) {
            case "minutesList":
                return {
                    minutes: ms.getAllMinutes(),
                    meetingSeriesId: _meetingSeriesID
                };

            case "topicListTab":
                let status = Session.get("actionItemStatus");
                let  topics = (status === "open") ? ms.openTopics : ms.closedTopics;

                return {
                    status: status,
                    topics: topics
                };
        }
    },

    isModerator: function () {
        let usrRole = new UserRoles(Meteor.userId());
        return usrRole.isModeratorOf(_meetingSeriesID);
    }
});

Template.meetingSeriesDetails.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "click .nav-tabs li": function(event, tmpl) {
        var currentTab = $(event.target).closest("li");

        currentTab.addClass("active");
        $(".nav-tabs li").not(currentTab).removeClass("active");

        Session.set("currentTab", currentTab.data("template"));

        if (currentTab.data("action")) {
            Session.set("actionItemStatus", currentTab.data("action"));
        }
    }
});
