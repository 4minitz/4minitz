import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { FlashMessage } from '/client/helpers/flashMessage';
import $ from 'jquery';

function loginCallback(error) {
    if (error) {
        console.error('An error occurred while trying to log in:', error);
        (new FlashMessage('Login error', error.message)).show();
    }

    let routeName = FlowRouter.current().route.name;
    if (routeName === 'login' || routeName === 'signup' || routeName === 'home') {
        FlowRouter.go('home');
    }
}

Template.loginLdap.events({
    'submit #ldapLoginForm'(event) {
        event.preventDefault();

        let username = $('#id_ldapUsername').val();
        let password = $('#id_ldapPassword').val();

        Meteor.loginWithLdap(username, password, loginCallback);
    }
});