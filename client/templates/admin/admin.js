import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';


Template.admin.onCreated(function() {
    // The default Tab
    this.activeTabTemplate = new ReactiveVar('tabAdminUsers');
    this.activeTabId = new ReactiveVar('tab_users');
});

Template.admin.helpers({
    redirectIfNotAllowed() {
        if (!Meteor.user() || !Meteor.user().isAdmin) {
            FlowRouter.go('/');
        }
    },

    // give active tab some CSS highlighting
    isTabActive: function (tabId) {
        return (Template.instance().activeTabId.get() === tabId) ? 'active' : '';
    },

    tab: function() {
        return Template.instance().activeTabTemplate.get();
    }

});

Template.admin.events({
    // Switch between tabs via user click on <li>
    'click .nav-tabs li': function(event, tmpl) {
        let currentTab = $(event.target).closest('li');

        tmpl.activeTabId.set(currentTab.attr('id'));
        tmpl.activeTabTemplate.set(currentTab.data('template'));
    }
});
