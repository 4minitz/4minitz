let _ = require('underscore');

module.exports = function (ldapSettings, userData) {
    ldapSettings.propertyMap = ldapSettings.propertyMap || {};
    const usernameAttribute = ldapSettings.searchDn || ldapSettings.propertyMap.username || 'cn',
        longnameAttribute = ldapSettings.propertyMap.longname,
        mailAttribute = ldapSettings.propertyMap.email || 'mail',
        bindWith = ldapSettings.bindWith || 'dn';

    // userData.mail may be a string with one mail address or an array.
    // Nevertheless we are only interested in the first mail address here - if there should be more...
    let tmpEMail = userData[mailAttribute];
    if (Array.isArray(tmpEMail)) {
        tmpEMail = tmpEMail[0];
    }
    let tmpEMailArray = [{
        address: tmpEMail,
        verified: true,
        fromLDAP: true
    }];

    let username = userData[usernameAttribute] || '';
console.log('bind with', bindWith);
    const whiteListedFields = ldapSettings.whiteListedFields || [];
    const profileFields = whiteListedFields.concat(['dn', bindWith]);

    let user = {
        createdAt: new Date(),
        isInactive: false,
        emails: tmpEMailArray,
        username: username.toLowerCase(),
        profile: _.pick(userData, profileFields)
    };

    // copy over the LDAP user's long name from "cn" field to the meteor accounts long name field
    if (longnameAttribute) {
        user.profile.name = userData[longnameAttribute];
    }

    if (userData.isInactive) {
        user.isInactive = true;
    }
    return user;
};
