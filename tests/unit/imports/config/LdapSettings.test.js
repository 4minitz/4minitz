import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const Meteor = {
  settings: {
    ldap: {},
  },
};

const { LdapSettings } = proxyquire("../../../../imports/config/LdapSettings", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
});

describe("LdapSettings", function () {
  describe("#loadSettingsAndPerformSanityCheck", function () {
    beforeEach(function () {
      Meteor.settings.ldap = {
        enabled: true,
        serverDn: "",
        serverUrl: "",
        propertyMap: {
          username: "cn",
          email: "mail",
        },
      };
    });

    it("does not enable ldap if it is disabled", function () {
      Meteor.settings.ldap.enabled = false;

      LdapSettings.loadSettingsAndPerformSanityCheck();

      expect(LdapSettings.ldapEnabled()).to.be.false;
    });

    it("disables ldap if no server url is set", function () {
      Meteor.settings.ldap = Object.assign(Meteor.settings.ldap, {
        enabled: true,
        serverUrl: undefined,
      });

      LdapSettings.loadSettingsAndPerformSanityCheck();

      expect(LdapSettings.ldapEnabled()).to.be.false;
    });

    it("disables ldap if no server dn is defined", function () {
      Meteor.settings.ldap = Object.assign(Meteor.settings.ldap, {
        enabled: true,
        serverDn: undefined,
      });

      LdapSettings.loadSettingsAndPerformSanityCheck();

      expect(LdapSettings.ldapEnabled()).to.be.false;
    });

    it("disables ldap if no mapping from ldap attribute to username and no searchDn is given", function () {
      Meteor.settings.ldap.propertyMap.username = null;

      LdapSettings.loadSettingsAndPerformSanityCheck();

      expect(LdapSettings.ldapEnabled()).to.be.false;
    });

    it("disables ldap if no mapping from ldap attribute to email is given", function () {
      Meteor.settings.ldap.propertyMap.email = null;

      LdapSettings.loadSettingsAndPerformSanityCheck();

      expect(LdapSettings.ldapEnabled()).to.be.false;
    });
  });

  describe("#loadSettings", function () {
    beforeEach(function () {
      Meteor.settings.ldap = {};
    });

    it("properly merges the default settings with the user defined settings", function () {
      Meteor.settings.ldap.enabled = true;

      LdapSettings.loadSettings();

      expect(LdapSettings.ldapEnabled()).to.be.true;
    });

    it("uses the default property map if none is given", function () {
      LdapSettings.loadSettings();

      expect(LdapSettings.usernameAttribute()).to.equal("cn");
      expect(LdapSettings.emailAttribute()).to.equal("mail");
    });

    it("properly merges property maps", function () {
      Meteor.settings.ldap.propertyMap = {
        email: "foo",
      };

      LdapSettings.loadSettings();

      expect(LdapSettings.usernameAttribute()).to.equal("cn");
      expect(LdapSettings.emailAttribute()).to.equal("foo");
    });

    it("LEGACY: respects the searchDn setting if no property map is given", function () {
      Meteor.settings.ldap.searchDn = "cn";

      LdapSettings.loadSettings();

      expect(LdapSettings.usernameAttribute()).to.equal("cn");
    });

    it("LEGACY: propertyMap has priority over searchDn", function () {
      Meteor.settings.ldap.searchDn = "cn";
      Meteor.settings.ldap.propertyMap = {
        username: "uid",
      };

      LdapSettings.loadSettings();

      expect(LdapSettings.usernameAttribute()).to.equal("uid");
    });
  });
});
