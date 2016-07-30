import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Router } from 'meteor/iron:router';
import { LDAP } from 'meteor/babrahams:accounts-ldap';
import $ from 'jquery';

function loginCallback(error) {
    if (error) {
        console.error('An error occurred while trying to log in:', error);
    }

    let routeName = Router.current().route.getName();
    if (routeName === 'login' || routeName === 'signup' || routeName === 'home') {
        Router.go('home');
    }
}

Template.loginLdap.events({
    "submit #ldapLoginForm"(event) {
        event.preventDefault();

        let username = $('#id_ldapUsername').val();
        let password = $('#id_ldapPassword').val();

        Meteor.loginWithLdap(username, password, loginCallback);
    }
});