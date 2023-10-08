import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import _ from "underscore";

const Meteor = {
  startup: sinon.mock(),
  settings: {
    ldap: {},
  },
};
const LDAP = {};
const LdapSettings = {
  ldapEnabled: sinon.stub(),
  usernameAttribute: sinon.stub(),
  searchFilter: sinon.stub(),
  serverDn: sinon.stub(),
  allowSelfSignedTLS: sinon.stub().returns(false),
};

const { ldap } = proxyquire("../../../server/ldap", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/config/LdapSettings": { LdapSettings, "@noCallThru": true },
  "meteor/babrahams:accounts-ldap": { LDAP, "@noCallThru": true },
});

describe("ldap", () => {
  describe("#bindValue", () => {
    beforeEach(() => {
      Meteor.settings = {
        ldap: {
          enabled: true,
        },
      };

      LdapSettings.ldapEnabled.reset();
      LdapSettings.ldapEnabled.returns(true);
      LdapSettings.serverDn.reset();
      LdapSettings.serverDn.returns("dc=example,dc=com");
      LdapSettings.usernameAttribute.reset();
      LdapSettings.usernameAttribute.returns("test");
    });

    it("generates a dn based on the configuration and the given username", () => {
      const isEmail = false;
      const username = "username";

      const result = LDAP.bindValue(username, isEmail);

      expect(result).to.equal("test=username,dc=example,dc=com");
    });

    it("removes the host part if an email address is given", () => {
      const isEmail = true;
      const username = "username@example.com";

      const result = LDAP.bindValue(username, isEmail);

      expect(result).to.equal("test=username,dc=example,dc=com");
    });

    it("returns an empty string if ldap is not enabled", () => {
      LdapSettings.ldapEnabled.returns(false);

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });

    it("returns an empty string if serverDn is not set", () => {
      LdapSettings.serverDn.returns("");

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });

    it("returns an empty string if no username attribute mapping is not defined", () => {
      LdapSettings.usernameAttribute.returns("");

      const result = LDAP.bindValue();

      expect(result).to.equal("");
    });
  });

  describe("#filter", () => {
    beforeEach(() => {
      LdapSettings.usernameAttribute.reset();
      LdapSettings.searchFilter.reset();

      Meteor.settings = {
        ldap: {
          enabled: true,
        },
      };
    });

    it("generates a dn based on the configuration and the given username", () => {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("");

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });

    it("removes the host part if an email address is given", () => {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("");

      const isEmail = true;
      const username = "username@example.com";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });

    it("still works if searchFilter is undefined", () => {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns();

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username))");
    });

    it("appends the searchFilter configuration to the filter", () => {
      LdapSettings.usernameAttribute.returns("test");
      LdapSettings.searchFilter.returns("(objectClass=user)");

      const isEmail = false;
      const username = "username";

      const result = LDAP.filter(isEmail, username);

      expect(result).to.equal("(&(test=username)(objectClass=user))");
    });

    it("returns an empty string if the ldap configuration is missing", () => {
      delete Meteor.settings.ldap;

      const result = LDAP.filter();

      expect(result).to.equal("");
    });

    it("returns an empty string if ldap is not enabled", () => {
      Meteor.settings.ldap.enabled = false;

      const result = LDAP.filter();

      expect(result).to.equal("");
    });

    it("returns an empty string if searchDn is not set", () => {
      const result = LDAP.filter();

      expect(result).to.equal("");
    });
  });

  describe("#addFields", () => {
    it("returns an object with a password property that holds an empty string", () => {
      const expectedResult = {
        password: "",
      };

      const result = LDAP.addFields();

      expect(result).to.deep.equal(expectedResult);
    });
  });

  describe("#log", () => {
    beforeEach(() => {
      sinon.spy(console, "log");
      sinon.spy(console, "error");
      sinon.spy(console, "warn");
    });

    afterEach(() => {
      console.log.restore();
      console.error.restore();
      console.warn.restore();
    });

    it("forwards error messages to the console", () => {
      const message = "some error";

      LDAP.error(message);

      expect(console.error.calledOnce).to.be.true;
    });

    it("forwards warning messages to the console", () => {
      const message = "some warning";

      LDAP.warn(message);

      expect(console.warn.calledOnce).to.be.true;
    });
  });
});
