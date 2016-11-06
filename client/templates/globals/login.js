import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { GlobalSettings } from '/imports/GlobalSettings'

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
        return Session.get("currentLoginForm");
    },

    showInfoOnLogin: function () {
        return (!Meteor.userId() && GlobalSettings.showInfoOnLogin());
    },

    showDemoUserHint: function () {
        return (!Meteor.userId() && GlobalSettings.createDemoAccount());
    }
});

Template.login.events({
    "click .nav-tabs li": function(event) {
        var currentTab = $(event.target).closest("li");

        currentTab.addClass("active");
        $(".nav-tabs li").not(currentTab).removeClass("active");

        Session.set("currentLoginForm", currentTab.data("template"));
    }
});