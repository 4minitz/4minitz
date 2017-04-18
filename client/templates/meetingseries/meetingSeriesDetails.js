import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'
import { User, userSettings } from '/imports/users'

import { TabItemsConfig } from './tabItems'
import { TabTopicsConfig } from './tabTopics'


let _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    this.seriesReady = new ReactiveVar();

    this.autorun(() => {
        _meetingSeriesID = FlowRouter.getParam('_id');
        this.showSettingsDialog = FlowRouter.getQueryParam('edit') === 'true';

        let subscriptionHandle = this.subscribe('meetingSeries', _meetingSeriesID);

        this.seriesReady.set(subscriptionHandle.ready());
    });

    this.activeTabTemplate = new ReactiveVar("tabMinutesList");
    this.activeTabId = new ReactiveVar("tab_minutes");
});

Template.meetingSeriesDetails.onRendered(function () {
    if (this.showSettingsDialog) {
        Session.set("meetingSeriesEdit.showUsersPanel", true);

        // Defer opening the meeting series settings dialog after rendering of the template
        window.setTimeout(function () {
            $('#dlgEditMeetingSeries').modal('show');
        }, 10);
    }
});

Template.meetingSeriesDetails.helpers({
    authenticating() {
        const subscriptionReady = Template.instance().seriesReady.get();
        return Meteor.loggingIn() || !subscriptionReady;
    },
    redirectIfNotAllowed() {
        let usrRoles = new UserRoles();
        if (!usrRoles.hasViewRoleFor(_meetingSeriesID)) {
            FlowRouter.go('/');
        }
    },
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

    isTabActive: function (tabId) {
        return (Template.instance().activeTabId.get() === tabId) ? 'active' : '';
    },

    tab: function() {
        return Template.instance().activeTabTemplate.get();
    },

    tabData: function() {
        let tmpl = Template.instance();
        let tab = tmpl.activeTabTemplate.get();
        let ms = new MeetingSeries(_meetingSeriesID);

        switch (tab) {
            case "tabMinutesList":
                return {
                    minutes: ms.getAllMinutes(),
                    meetingSeriesId: _meetingSeriesID
                };

            case "tabTopics":
            {
                return new TabTopicsConfig(ms.topics, _meetingSeriesID);
            }

            case "tabItems":
            {
                return new TabItemsConfig(ms.topics, _meetingSeriesID);
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
        const user = new User();
        user.storeSetting(userSettings.showQuickHelp.meetingSeries, false);
    },
    "click .nav-tabs li": function(event, tmpl) {
        let currentTab = $(event.target).closest("li");

        tmpl.activeTabId.set(currentTab.attr('id'));
        tmpl.activeTabTemplate.set(currentTab.data("template"));
    }
});
