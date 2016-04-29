
import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'

var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    _meetingSeriesID = this.data;
    Session.setDefault("currentTab", "minutesList");
});

Template.meetingSeriesDetails.onRendered(function () {
    Session.set("currentTab", "minutesList");
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
        let title = ms.project + " - " + ms.name;

        switch (tab) {
            case "minutesList":
                return {
                    minutes: ms.getAllMinutes(),
                    title: title,
                    meetingSeriesId: _meetingSeriesID
                };

            case "topicListTab":
                let status = Session.get("actionItemStatus");
                let  topics = (status === "open") ? ms.openTopics : ms.closedTopics;

                return {
                    status: status,
                    topics: topics,
                    title: title
                };

            case "decisionList":
                return {
                    title: title
                };
        }
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
