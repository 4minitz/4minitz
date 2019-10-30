import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { i18n } from 'meteor/universe:i18n';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import { MeetingSeries } from '/imports/meetingseries';
import { MinutesFinder } from '/imports/services/minutesFinder';
import { UserRoles } from '/imports/userroles';

import { TabItemsConfig } from './tabItems';
import { TabTopicsConfig } from './tabTopics';
import {TopicsFinder} from '../../../imports/services/topicsFinder';
import {formatDateISO8601Time} from '../../../imports/helpers/date';

let _meetingSeriesID;   // the parent meeting object of this minutes

const isModerator = () => {
    const usrRole = new UserRoles();
    return usrRole.isModeratorOf(_meetingSeriesID);
};

const rememberLastTab = (tmpl) => {
    Session.set('meetingSeriesEdit.lastTab', {
        tabId: tmpl.activeTabId.get(),
        tabTemplate: tmpl.activeTabTemplate.get()
    });
};

Template.meetingSeriesDetails.onCreated(function () {
    this.seriesReady = new ReactiveVar();

    this.autorun(() => {
        _meetingSeriesID = FlowRouter.getParam('_id');
        this.showSettingsDialog = FlowRouter.getQueryParam('edit') === 'true';

        this.subscribe('meetingSeriesDetails', _meetingSeriesID);
        this.subscribe('minutes', _meetingSeriesID);
        this.subscribe('files.attachments.all', _meetingSeriesID); //Attachments have to be subscribed at this point, since each minute will show an icon indicating if they're containing attachments
        // subscribe topics for this series, too. If we do this in the tabs templates directly
        // the subscription will be un-subscribed and subscribed again when switching between both tabs.
        this.subscribe('topics', _meetingSeriesID);
        this.seriesReady.set(this.subscriptionsReady());
    });

    // Did another view request to restore the last tab on this view?
    if (Session.get('restoreTabAfterBackButton') && Session.get('meetingSeriesEdit.lastTab')) {
        this.activeTabId = new ReactiveVar(Session.get('meetingSeriesEdit.lastTab').tabId);
        this.activeTabTemplate = new ReactiveVar(Session.get('meetingSeriesEdit.lastTab').tabTemplate);
        Session.set('restoreTabAfterBackButton', false);
    } else {
        this.activeTabId = new ReactiveVar('tab_minutes');
        this.activeTabTemplate = new ReactiveVar('tabMinutesList');
        rememberLastTab(this);
    }
});

Template.meetingSeriesDetails.onRendered(function () {
    if (this.showSettingsDialog && isModerator()) {
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
        const topics = TopicsFinder.allTopicsOfMeetingSeries(_meetingSeriesID);

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
        return isModerator();
    },

    isMeetingSeriesEditedByAnotherUser: function () {
        let ms = new MeetingSeries(_meetingSeriesID);
        if (ms.isEditedBy == undefined && ms.isEditedDate == undefined)
            return false;
        return ms.isEditedBy !== Meteor.userId();
    },

    meetingSeriesEditedBy() {
        let ms = new MeetingSeries(_meetingSeriesID);
        let user = Meteor.users.findOne({_id: ms.isEditedBy});

        return i18n.__('MeetingSeries.Edit.editedBy', {user: user.username, date: formatDateISO8601Time(ms.isEditedDate)});
    }
});

Template.meetingSeriesDetails.events({
    'click .nav-tabs li': function(event, tmpl) {
        let currentTab = $(event.target).closest('li');

        tmpl.activeTabId.set(currentTab.attr('id'));
        tmpl.activeTabTemplate.set(currentTab.data('template'));
        rememberLastTab(tmpl);
    }
});
