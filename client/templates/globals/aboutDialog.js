import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { GlobalSettings } from '/imports/config/GlobalSettings';

let showStatistics = new ReactiveVar(false);

Template.aboutDialog.onRendered(function() {
});

Template.aboutDialog.helpers({
    gitVersionInfo: function () {
        return Session.get('gitVersionInfo');
    },

    currentYear: function() {
        return new Date().getFullYear();
    },

    displayStatistics: function() {
        return showStatistics.get();
    },

    legalNoticeEnabled: function () {
        return Meteor.settings.public.branding.legalNotice.enabled;
    },
    legalNoticeLinktext: function () {
        return Meteor.settings.public.branding.legalNotice.linkText;
    }
});

Template.aboutDialog.events({
    'click #about-4minitz-logo' : function(){
        showStatistics.set(!showStatistics.get());
    },

    'click #btnLegalNotice': function () {
        $('#dlgAbout').modal('hide');
        $('.modal-backdrop').remove();  // The backdrop was sticky - we remove it manually...
        window.open(GlobalSettings.getLegalNoticeExternalUrl());
    },

    'show.bs.modal #dlgAbout': function () {
        Meteor.call('gitVersionInfo', function (error, result) {
            if (!error) {
                Session.set('gitVersionInfo', result);
            }
            else {
                console.log('err:'+error);
            }
        });
    },
});
