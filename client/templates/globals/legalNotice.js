import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.legalNotice.helpers({
    legalNoticeContent: function () {
        if (Meteor.settings.public.branding.legalNotice.enabled) {
            return Meteor.settings.public.branding.legalNotice.content.join(' ');
        } else {
            return '<b>No legal notice specified.</b><br>You can do so via settings.json key: branding.legalNotice';
        }
    }
});
