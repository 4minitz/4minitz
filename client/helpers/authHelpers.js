import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

Template.registerHelper('isLoggedIn', () => {
    console.log('---isLoggedIn: ', !!Meteor.user());
    return !!Meteor.user();
});