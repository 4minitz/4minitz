import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'

import { TopicListConfig } from '../topic/topicsList'
import { ItemListConfig } from './itemsList'
import { TabConfig } from './tabTopicsItems'


var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    _meetingSeriesID = this.data.meetingSeriesId;
    Session.setDefault("currentTab", "minutesList");
    Session.setDefault("activeTabId", "tab_minutes");
});

Template.meetingSeriesDetails.onRendered(function () {
    Session.set("currentTab", "minutesList");
    Session.set("activeTabId", "tab_minutes");

    if (this.data.openMeetingSeriesEditor) {
        Session.set("meetingSeriesEdit.showUsersPanel", true);
        $('#dlgEditMeetingSeries').modal('show');
    }
});

Template.meetingSeriesDetails.helpers({
    meetingSeries: function() {
        return new MeetingSeries(_meetingSeriesID);
    },

    minutes: function() {
        let ms = new MeetingSeries(_meetingSeriesID);
        return ms.getAllMinutes();
    },

    isTabActive: function (tabId) {
        return (Session.get('activeTabId') === tabId) ? 'active' : '';
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

            case "topicsList":
            {
                let status = Session.get("actionItemStatus");
                let topics;
                switch (status) {
                    case "open":
                        topics = ms.openTopics;
                        break;
                    case "topics":
                        topics = ms.topics;
                        break;
                    default:
                        throw new Meteor.Error("illegal-state", "Unknown topic list status: " + status);
                }

                return new TopicListConfig(topics, null, true, _meetingSeriesID);
            }

            case "tabTopicsItems":
            {
                let s = Session.get("actionItemStatus");
                return new TabConfig(ms.topics, _meetingSeriesID, (s === 'items'));
            }

            default: throw new Meteor.Error('illegal-state', 'Unknown tab: ' + tab);
        }
    },

    isModerator: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(_meetingSeriesID);
    }
});

Template.meetingSeriesDetails.events({
    "click #btnHideHelp": function () {
        $(".help").hide();  // use jQuery to find and hide class
    },
    "click .nav-tabs li": function(event) {
        var currentTab = $(event.target).closest("li");

        //currentTab.addClass("active");
        //$(".nav-tabs li").not(currentTab).removeClass("active");
        Session.set('activeTabId', currentTab.attr('id'));

        Session.set("currentTab", currentTab.data("template"));

        if (currentTab.data("action")) {
            Session.set("actionItemStatus", currentTab.data("action"));
        }
    }
});
