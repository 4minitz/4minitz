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
    // Meteor treats user names case insensitive. EMails are also case insensitive
    usernameOrEmail = usernameOrEmail.toLowerCase();

    const ldapSettings = Meteor.settings.ldap || {},
        serverDn = ldapSettings.serverDn,
        propertyMap = ldapSettings.propertyMap || {},
        searchDn = ldapSettings.searchDn || propertyMap.username;

    if (!serverDn || !searchDn) {
        return '';
    }


    if (Meteor && Meteor.users) {   // skip this during unit tests
        let findAttribs = [{ username: usernameOrEmail }];
        const eMailPrefix = (isEmailAddress) ? usernameOrEmail.split('@')[0] : usernameOrEmail;
        if (eMailPrefix.length > 0) {
            findAttribs.push({ username: eMailPrefix });
            findAttribs.push({ 'emails.address' : {'$regex' : '^'+usernameOrEmail+'$', '$options' : 'i'}});
            findAttribs.push({ 'emails.address' : {'$regex' : '^'+usernameOrEmail+'@', '$options' : 'i'} });
        }

        console.log({$or: findAttribs});
        let users = Meteor.users.find({$or: findAttribs}).fetch();
        if (users.length > 1) {
            throw new Meteor.Error(403, 'User name or mail address is not unique');
        }
        if (users.length === 0) {
            throw new Meteor.Error(403, 'Invalid credentials. Zero!');
        }

        let user = users[0];

        // #Security
        // If users have been imported with importUsers.js and "isInactivePredicate" was used to
        // make some users isInactive===true - we stop them from logging in here.
        if (user && user.isInactive) {
            throw new Meteor.Error(403, 'User is inactive');
        }

        if (user && user.profile && user.profile.dn) {
            console.log("Will return user.profile.dn:", user.profile.dn);
            return user.profile.dn;
        }
    }

    return [searchDn, '=', usernameOrEmail, ',', serverDn].join('');
};

LDAP.filter = function (isEmailAddress, usernameOrEmail) {
    if (!ldapEnabled()) {
        return '';
    }

    const ldapSettings = Meteor.settings.ldap || {},
        propertyMap = ldapSettings.propertyMap || {},
        searchField = ldapSettings.searchDn || propertyMap.username;

    if (!searchField) {
        return '';
    }

    const searchValue = (isEmailAddress) ? usernameOrEmail.split('@')[0] : usernameOrEmail;
    const filter = Meteor.settings.ldap.searchFilter || '';

    return ['(&(', searchField, '=', searchValue, ')', filter ,')'].join('');
};

LDAP.addFields = function (/*person - the ldap entry for that user*/) {
    // this = ldap request object

    return {
        // overwrite the password to prevent local logins
        password: ''
    };
};

// Called after successful LDAP sign in
if (LDAP.onSignIn) {    // not available in unit test environment
    LDAP.onSignIn(function (userDocument) {
        console.log(">>> userDocument:", userDocument, "<<<");
        Meteor.users.update({_id: userDocument._id}, {$set: {isLDAPuser: true}});
    });
}


LDAP.logging = false;
LDAP.warn = function(message) {
    console.warn(message);
};
LDAP.error = function(message) {
    console.error(message);
};
