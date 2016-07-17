import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.login.helpers({
    ldapEnabled() {
        return Meteor.settings.public.ldapEnabled;
    }
});