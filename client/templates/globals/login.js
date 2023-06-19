import { Meteor } from 'meteor/meteor';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
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

    showTabSwitcher() {
        return (Meteor.settings.public.ldapEnabled
            && !Meteor.settings.public.ldapHideStandardLogin);
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
        return (!Meteor.userId()
            && GlobalSettings.createDemoAccount()
            && Session.get('currentLoginForm') === 'atForm' // only if Standard Login is active
            && AccountsTemplates.getState() === 'signIn'    // only show demo hint on signIn sub-template
        );
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
        window.open(GlobalSettings.getLegalNoticeExternalUrl());
    },

    'click #tab_standard': function() {
        AccountsTemplates.setState('signIn');
    }
});
