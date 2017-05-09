import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { GlobalSettings } from '/imports/config/GlobalSettings';

const ldapEnabled = Meteor.settings.public.ldapEnabled;

Template.login.onCreated(function () {
    let defaultTab = ldapEnabled ? 'loginLdap' : 'atForm';
    Session.setDefault('currentLoginForm', defaultTab);
});

Template.login.onRendered(function () {
    let tab = ldapEnabled ? 'loginLdap' : 'atForm';
    Session.setDefault('currentLoginForm', tab);
});

Template.login.helpers({
    ldapEnabled() {
        return Meteor.settings.public.ldapEnabled;
    },

    tab: function() {
        return Session.get('currentLoginForm');
    },

    tabActive: function(tabFormName) {
        if (Session.get('currentLoginForm') === tabFormName) {
            return 'active';
        }
        return '';
    },

    showInfoOnLogin: function () {
        return (!Meteor.userId() && GlobalSettings.showInfoOnLogin());
    },

    showDemoUserHint: function () {
        return (!Meteor.userId() && GlobalSettings.createDemoAccount());
    },

    legalNoticeEnabled: function () {
        return Meteor.settings.public.branding.legalNotice.enabled;
    },
    legalNoticeLinktext: function () {
        return Meteor.settings.public.branding.legalNotice.linkText;
    },
});

Template.login.events({
    'click .nav-tabs li': function(event) {
        let currentTab = $(event.target).closest('li');

        currentTab.addClass('active');
        $('.nav-tabs li').not(currentTab).removeClass('active');

        Session.set('currentLoginForm', currentTab.data('template'));
    },

    'click #btnLegalNotice': function () {
        FlowRouter.go('/legalnotice');
    }
});
