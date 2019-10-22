import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { i18n } from 'meteor/universe:i18n';

let showStatistics = new ReactiveVar(false);

Template.aboutDialog.onRendered(function() {
});

Template.aboutDialog.helpers({
    gitVersionInfo: function () {
        return Session.get('gitVersionInfo');
    },
    displayStatistics: function() {
        return showStatistics.get();
    },

    legalNoticeEnabled: function () {
        return Meteor.settings.public.branding.legalNotice.enabled;
    },
    legalNoticeLinktext: function () {
        return Meteor.settings.public.branding.legalNotice.linkText;
    },

    contributorsLink: function() {
        return i18n.__('about.ThanksContributors', {purify: string => string}, {urlOpen: '<a href="https://github.com/4minitz/4minitz/graphs/contributors" target="_blank">', urlClose: '</a>'});
    }
});

Template.aboutDialog.events({
    'click #about-4minitz-logo' : function(){
        showStatistics.set(!showStatistics.get());
    },

    'click #btnLegalNotice': function () {
        $('#dlgAbout').modal('hide');
        $('.modal-backdrop').remove();  // The backdrop was sticky - we remove it manually...
        FlowRouter.go('/legalnotice');
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
