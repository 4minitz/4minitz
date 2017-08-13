import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { MeetingSeries } from '/imports/meetingseries';
import { MinutesFinder } from '/imports/services/minutesFinder';
import { UserRoles } from '/imports/userroles';

import { TabItemsConfig } from './tabItems';
import { TabTopicsConfig } from './tabTopics';
import {TopicsFinder} from '../../../imports/services/topicsFinder';


let _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    this.seriesReady = new ReactiveVar();

    this.autorun(() => {
        _meetingSeriesID = FlowRouter.getParam('_id');
        this.showSettingsDialog = FlowRouter.getQueryParam('edit') === 'true';

        let subscriptionHandle = this.subscribe('meetingSeries', _meetingSeriesID);

        this.seriesReady.set(subscriptionHandle.ready());
    });

    this.activeTabTemplate = new ReactiveVar('tabMinutesList');
    this.activeTabId = new ReactiveVar('tab_minutes');
});

Template.meetingSeriesDetails.onRendered(function () {
    if (this.showSettingsDialog) {
        Session.set('meetingSeriesEdit.showUsersPanel', true);

        // Defer opening the meeting series settings dialog after rendering of the template
        window.setTimeout(function () {
            $('#dlgEditMeetingSeries').modal('show');
        }, 500);
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

    isTabActive: function (tabId) {
        return (Template.instance().activeTabId.get() === tabId) ? 'active' : '';
    },

    tab: function() {
        return Template.instance().activeTabTemplate.get();
    },

    tabData: function() {
        const tmpl = Template.instance();
        const tab = tmpl.activeTabTemplate.get();
        const ms = new MeetingSeries(_meetingSeriesID);
        const topics = TopicsFinder.allTopicsOfMeetingSeries(_meetingSeriesID); // ms.topics;

        switch (tab) {
        case 'tabMinutesList':
            return {
                minutes: MinutesFinder.allMinutesOfMeetingSeries(ms.getRecord()),
                meetingSeriesId: _meetingSeriesID
            };

        case 'tabTopics':
        {
            return new TabTopicsConfig(topics, _meetingSeriesID);
        }

        case 'tabItems':
        {
            return new TabItemsConfig(topics, _meetingSeriesID);
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
    'click .nav-tabs li': function(event, tmpl) {
        let currentTab = $(event.target).closest('li');

        tmpl.activeTabId.set(currentTab.attr('id'));
        tmpl.activeTabTemplate.set(currentTab.data('template'));
    }
});
