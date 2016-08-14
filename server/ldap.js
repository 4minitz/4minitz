import { LDAP } from 'meteor/babrahams:accounts-ldap';
import { Meteor } from 'meteor/meteor';

Meteor.settings = Meteor.settings || {};
Meteor.settings.ldap = Meteor.settings.ldap || {};

let allowSelfSignedTLS = Meteor.settings.ldap.allowSelfSignedTLS;
if (allowSelfSignedTLS) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
}

LDAP.searchField = Meteor.settings.ldap.searchDn;
LDAP.searchValueType = 'username';

function ldapEnabled() {
    return !!Meteor.settings &&
        Meteor.settings.ldap &&
        Meteor.settings.ldap.enabled;
}

Meteor.startup(() => {
    // propagate the ldap enabled flag to the clients
    Meteor.settings.public.ldapEnabled = ldapEnabled();
});

LDAP.bindValue = function (usernameOrEmail, isEmailAddress) {
    if (!ldapEnabled()) {
        return '';
    }

    const serverDn = Meteor.settings.ldap.serverDn;
    const searchDn = Meteor.settings.ldap.searchDn;

    if (!serverDn || !searchDn) {
        return '';
    }

    const username = (isEmailAddress) ? usernameOrEmail.split('@')[0] : usernameOrEmail;

    return [searchDn, '=', username, ',', serverDn].join('');
};

LDAP.filter = function (isEmailAddress, usernameOrEmail) {
    if (!ldapEnabled()) {
        return '';
    }

    const searchField = Meteor.settings.ldap.searchDn;

    if (!searchField) {
        return '';
    }

    const searchValue = (isEmailAddress) ? usernameOrEmail.split('@')[0] : usernameOrEmail;
    const filter = Meteor.settings.ldap.searchFilter || "";

    return ['(&(', searchField, '=', searchValue, ')', filter ,')'].join('');
};

LDAP.addFields = function (/*person - the ldap entry for that user*/) {
    // this = ldap request object

    return {
        // overwrite the password to prevent local logins
        password: ''
    };
};

LDAP.log = function (message) {
    // The ldap plugin prints the user password in clear text in the log
    // The log leaking the password always starts with 'Creating user'
    // so we filter it here
    if (message.indexOf('Creating user') === 0) {
        return;
    }

    // Let all the other log messages go through
    console.log(message);
};
