import { LDAP } from "meteor/babrahams:accounts-ldap";
import { Meteor } from "meteor/meteor";
import { LdapSettings } from "/imports/config/LdapSettings";

const allowSelfSignedTLS = LdapSettings.allowSelfSignedTLS();
if (allowSelfSignedTLS) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
}

LDAP.searchField = LdapSettings.usernameAttribute();
LDAP.searchValueType = "username";

LDAP.bindValue = (usernameOrEmail, isEmailAddress) => {
  if (!LdapSettings.ldapEnabled()) {
    return "";
  }

  const serverDn = LdapSettings.serverDn();
  const searchDn = LdapSettings.usernameAttribute();

  if (!serverDn || !searchDn) {
    return "";
  }

  const username = isEmailAddress
    ? usernameOrEmail.split("@")[0]
    : usernameOrEmail;

  // #Security
  // If users have been imported with importUsers.js and "isInactivePredicate" was used to
  // make some users isInactive==true - we stop them from logging in here.
  if (Meteor?.users) {
    // skip this during unit tests
    const uid = username.toLowerCase();
    const user = Meteor.users.findOne({ username: uid });

    if (user?.isInactive) {
      throw new Meteor.Error(403, "User is inactive");
    }

    if (user?.profile && user.profile.dn) {
      return user.profile.dn;
    }
  }

  return [searchDn, "=", username, ",", serverDn].join("");
};

LDAP.filter = (isEmailAddress, usernameOrEmail) => {
  if (!LdapSettings.ldapEnabled()) {
    return "";
  }

  const searchField = LdapSettings.usernameAttribute();

  if (!searchField) {
    return "";
  }

  const searchValue = isEmailAddress
    ? usernameOrEmail.split("@")[0]
    : usernameOrEmail;
  const filter = LdapSettings.searchFilter();

  return ["(&(", searchField, "=", searchValue, ")", filter, ")"].join("");
};

LDAP.addFields = () => ({
  // overwrite the password to prevent local logins
  password: "",
});

// Called after successful LDAP sign in
if (LDAP.onSignIn) {
  // not available in unit test environment
  LDAP.onSignIn((userDocument) => {
    Meteor.users.update(
      { _id: userDocument._id },
      { $set: { isLDAPuser: true } },
    );
  });
}

LDAP.logging = false;
LDAP.warn = (message) => {
  console.warn(message);
};
LDAP.error = (message) => {
  console.error(message);
};
