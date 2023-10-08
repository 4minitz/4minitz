const _ = require("underscore");

module.exports = (ldapSettings, userData) => {
  ldapSettings.propertyMap = ldapSettings.propertyMap || {};
  const usernameAttribute =
      ldapSettings.searchDn || ldapSettings.propertyMap.username || "cn",
    longnameAttribute = ldapSettings.propertyMap.longname,
    mailAttribute = ldapSettings.propertyMap.email || "mail";

  // userData.mail may be a string with one mail address or an array.
  // Nevertheless we are only interested in the first mail address here - if there should be more...
  let tmpEMail = userData[mailAttribute];
  if (Array.isArray(tmpEMail)) {
    tmpEMail = tmpEMail[0];
  }
  const tmpEMailArray = [
    {
      address: tmpEMail,
      verified: true,
      fromLDAP: true,
    },
  ];

  const username = userData[usernameAttribute] || "";

  const whiteListedFields = ldapSettings.whiteListedFields || [];
  const profileFields = whiteListedFields.concat(["dn"]);

  const user = {
    createdAt: new Date(),
    isInactive: false,
    emails: tmpEMailArray,
    username: username.toLowerCase(),
    profile: _.pick(userData, _.without(profileFields, "mail")),
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
