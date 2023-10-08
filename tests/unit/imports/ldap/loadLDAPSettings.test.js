import { expect } from "chai";
import proxyquire from "proxyquire";

import asyncStubs from "../../../support/lib/asyncStubs";

const fs = {
  readFile: asyncStubs.doNothing,
  "@noCallThru": true,
};

const loadLDAPSettings = proxyquire(
  "../../../../imports/ldap/loadLDAPSettings",
  {
    fs,
  },
);

describe("loadLDAPSettings", () => {
  beforeEach(() => {
    fs.readFile = asyncStubs.doNothing;
  });

  it("reads a file and resolves with the ldap configuration", (done) => {
    fs.readFile = asyncStubs.returns(2, '{"ldap": {"enabled": true}}');

    loadLDAPSettings("ldapSettings.json")
      .then((result) => {
        try {
          expect(result.enabled).to.be.true;
          done();
        } catch (error) {
          done(error);
        }
      })
      .catch((error) => {
        done(new Error(error));
      });
  });

  it("handles file read errors gracefully", (done) => {
    fs.readFile = asyncStubs.returnsError(2, new Error("Could not read file"));

    loadLDAPSettings("ldapSettings.json")
      .then((result) => {
        done(new Error(`Unexpected result: ${result}`));
      })
      .catch((error) => {
        try {
          expect(error).to.deep.equal(
            'Could not read settings file "ldapSettings.json"',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it("handles json parse errors properly", (done) => {
    fs.readFile = asyncStubs.returns(2, "no valid json");

    loadLDAPSettings("ldapSettings.json")
      .then((result) => {
        done(new Error(`Unexpected result: ${result}`));
      })
      .catch((error) => {
        try {
          expect(error).to.deep.equal("Could not parse json.");
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it("handles missing ldap settings", (done) => {
    fs.readFile = asyncStubs.returns(2, '{"noLdap": true}');

    loadLDAPSettings("ldapSettings.json")
      .then((result) => {
        done(new Error(`Unexpected result: ${result}`));
      })
      .catch((error) => {
        try {
          expect(error).to.deep.equal('Property "ldap" not found.');
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});
