import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

Template.home.created = function () {
    //add your statement here 
};

Template.home.onCreated(function () {
    this.activeTabTemplate = new ReactiveVar('meetingSeriesList');
    this.activeTabId = new ReactiveVar('tab_meetings');
});

Template.home.helpers({
    isTabActive: function (tabId) {
        return (Template.instance().activeTabId.get() === tabId) ? 'active' : '';
    },

    tab: function() {
        let meetingSeriesTab = Session.get('gotoMeetingSeriesTab');
        if(meetingSeriesTab) {
            Template.instance().activeTabId.set('tab_meetings');
            Template.instance().activeTabTemplate.set('meetingSeriesList');
            Session.set('gotoMeetingSeriesTab', false);
        }
        else {
            return Template.instance().activeTabTemplate.get();
        }
    }
});

Template.home.events({
    'click .nav-tabs li': function(event, tmpl) {
        let currentTab = $(event.target).closest('li');

        tmpl.activeTabId.set(currentTab.attr('id'));
        tmpl.activeTabTemplate.set(currentTab.data('template'));
    }
});
