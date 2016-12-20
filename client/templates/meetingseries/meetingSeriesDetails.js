import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'
import { User, userSettings } from '/imports/users'

import { TopicListConfig } from '../topic/topicsList'
import { ItemListConfig } from './itemsList'


let _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    this.autorun(() => {
        _meetingSeriesID = FlowRouter.getParam('_id');
        this.showSettingsDialog = FlowRouter.getQueryParam('edit') === 'true';

        let usrRoles = new UserRoles();
        if (!usrRoles.hasViewRoleFor(_meetingSeriesID)) {
            FlowRouter.go('/');
        }
    });

    Session.setDefault("currentTab", "minutesList");
});

Template.meetingSeriesDetails.onRendered(function () {
    Session.set("currentTab", "minutesList");

    if (this.showSettingsDialog) {
        Session.set("meetingSeriesEdit.showUsersPanel", true);
        $('#dlgEditMeetingSeries').modal('show');
    }
});

Template.meetingSeriesDetails.helpers({
    meetingSeries: function() {
        return new MeetingSeries(_meetingSeriesID);
    },

    showQuickHelp: function() {
        const user = new User();
        return user.getSetting(userSettings.showQuickHelp.meetingSeries, true);
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

            case "topicsList":
                let status = Session.get("actionItemStatus");
                let  topics;
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

            case "itemsList":
                return new ItemListConfig(ms.topics, _meetingSeriesID);
        }
    },

    isModerator: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(_meetingSeriesID);
    }
});

Template.meetingSeriesDetails.events({
    "click #btnHideHelp": function () {
        const user = new User();
        user.storeSetting(userSettings.showQuickHelp.meetingSeries, false);
    },
    "click .nav-tabs li": function(event) {
        var currentTab = $(event.target).closest("li");

        currentTab.addClass("active");
        $(".nav-tabs li").not(currentTab).removeClass("active");

        Session.set("currentTab", currentTab.data("template"));

        if (currentTab.data("action")) {
            Session.set("actionItemStatus", currentTab.data("action"));
        }
    }
});
