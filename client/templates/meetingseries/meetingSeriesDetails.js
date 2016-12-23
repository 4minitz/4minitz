import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { MeetingSeries } from '/imports/meetingseries'
import { Minutes } from '/imports/minutes'
import { UserRoles } from '/imports/userroles'

import { TopicListConfig } from '../topic/topicsList'
import { ItemListConfig } from './itemsList'
import { TabConfig } from './tabTopicsItems'


var _meetingSeriesID;   // the parent meeting object of this minutes

Template.meetingSeriesDetails.onCreated(function () {
    _meetingSeriesID = this.data.meetingSeriesId;
    this.activeTabTemplate = new ReactiveVar("minutesList");
    this.activeTabId = new ReactiveVar("tab_minutes");

    let myTemplate = Template.instance();
    this.onSearchChangedHandler = (query) => {
        if (myTemplate.activeTabTemplate.get() === 'tabTopicsItems') {
            let tab_id = (query.indexOf('is:item') === -1) ? 'tab_topics' : 'tab_items';
            myTemplate.activeTabId.set(tab_id);
        }
    }
});

Template.meetingSeriesDetails.onRendered(function () {
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
            case "minutesList":
                return {
                    minutes: ms.getAllMinutes(),
                    meetingSeriesId: _meetingSeriesID
                };

            case "tabTopicsItems":
            {
                return new TabConfig(ms.topics, _meetingSeriesID, tmpl.activeTabId, tmpl.onSearchChangedHandler);
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
    "click .nav-tabs li": function(event, tmpl) {
        var currentTab = $(event.target).closest("li");

        tmpl.activeTabId.set(currentTab.attr('id'));
        tmpl.activeTabTemplate.set(currentTab.data("template"));
    }
});
