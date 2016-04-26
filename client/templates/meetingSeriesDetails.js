
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
        let title = ms.project + " - " + ms.name

        switch (tab) {
            case "minutesList":
                return {
                    minutes: ms.getAllMinutes(),
                    title: title
                };

            case "topicListTab":
                let status = Session.get("actionItemStatus");
                let filterOpen = status === "open";

                let  topics;
                if (ms.relatedActionItems) {
                    topics = ms.relatedActionItems.filter((topic) => {
                        return topic.isOpen === filterOpen;
                    });
                } else {
                    topics = [];
                }

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
    "click #deleteMinutes": function () {
        console.log("Remove Meeting Minute " + this._id);
        confirmationDialog(
            /* callback called if user wants to continue */
            () => {
                MeetingSeries.removeMinutesWithId(_meetingSeriesID, this._id);
            },
            /* Dialog content */
            "Do you really want to delete this meeting minute?"
        );
    },
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
