import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

class MeteorError {}
const Meteor = {
  Error: MeteorError,
  absoluteUrl: (path, config) => {
    if (!path) path = "";

    if (config?.rootUrl) {
      if (path !== "") path = `/${path}`;
      return config.rootUrl + path;
    }
    return path;
  },
};

const LdapSettings = {
  publish: sinon.stub(),
};

const { GlobalSettings } = proxyquire(
  "../../../imports/config/GlobalSettings",
  {
    "meteor/meteor": { Meteor, "@noCallThru": true },
    "/imports/config/LdapSettings": { LdapSettings, "@noCallThru": true },
  },
);

describe("GlobalSettings", () => {
  beforeEach("publish public settings", () => {
    Meteor.settings = require("../../../settings_sample.json");
    GlobalSettings.publishSettings();
  });

  describe("#getRootUrl", () => {
    it("returns the correct value", () => {
      expect(GlobalSettings.getRootUrl()).to.equal(Meteor.settings.ROOT_URL);
    });

    it("returns an empty string if property is not set", () => {
      delete Meteor.settings.ROOT_URL;
      expect(GlobalSettings.getRootUrl()).to.equal("");
    });

    it("does not fail if no settings file give", () => {
      Meteor.settings = {};
      expect(GlobalSettings.getRootUrl()).to.equal("");
    });
  });

  describe("#isTrustedIntranetInstallation", () => {
    it("returns the correct value", () => {
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.equal(
        Meteor.settings.trustedIntranetInstallation,
      );
    });

    it("returns false if property is not set", () => {
      delete Meteor.settings.trustedIntranetInstallation;
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.be.false;
    });

    it("does not fail if no settings file give", () => {
      Meteor.settings = {};
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.be.false;
    });
  });

  describe("#getDefaultEmailSenderAddress", () => {
    it("returns the default email sender address", () => {
      expect(GlobalSettings.getDefaultEmailSenderAddress()).to.equal(
        Meteor.settings.email.defaultEMailSenderAddress,
      );
    });

    it("returns the alternative address of the current user if property is left empty", () => {
      Meteor.settings.email.defaultEMailSenderAddress = "";
      const alternative = "alternativeSenderAddress";
      expect(GlobalSettings.getDefaultEmailSenderAddress(alternative)).to.equal(
        alternative,
      );
    });

    it("returns fallback sender address if no alternative address is given", () => {
      Meteor.settings.email.defaultEMailSenderAddress = "";
      expect(GlobalSettings.getDefaultEmailSenderAddress()).to.equal(
        Meteor.settings.email.fallbackEMailSenderAddress,
      );
    });

    it("throws exception if fallback sender address required but not given", () => {
      Meteor.settings.email.defaultEMailSenderAddress = "";
      delete Meteor.settings.email.fallbackEMailSenderAddress;
      let exceptionThrown;
      try {
        GlobalSettings.getDefaultEmailSenderAddress();
        exceptionThrown = false;
      } catch (e) {
        exceptionThrown = e instanceof MeteorError;
      }

      expect(exceptionThrown, "Method did not throw exception").to.be.true;
    });

    it("throws exception if property is not set", () => {
      delete Meteor.settings.email.defaultEMailSenderAddress;

      let exceptionThrown;
      try {
        GlobalSettings.getDefaultEmailSenderAddress();
        exceptionThrown = false;
      } catch (e) {
        exceptionThrown = e instanceof MeteorError;
      }

      expect(exceptionThrown, "Method did not throw exception").to.be.true;
    });
  });

  describe("#isEMailDeliveryEnabled", () => {
    it("returns the correct value", () => {
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.equal(
        Meteor.settings.email.enableMailDelivery,
      );
    });

    it("returns false if property is not set", () => {
      delete Meteor.settings.email.enableMailDelivery;
      GlobalSettings.publishSettings();
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.be.false;
    });

    it("does not fail if no settings file give", () => {
      Meteor.settings = {};
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.be.false;
    });
  });

  describe("#getMailDeliverer", () => {
    it("returns the correct value", () => {
      expect(GlobalSettings.getMailDeliverer()).to.equal(
        Meteor.settings.email.mailDeliverer,
      );
    });

    it("returns smtp if property is not set", () => {
      delete Meteor.settings.email.mailDeliverer;
      expect(GlobalSettings.getMailDeliverer()).to.equal("smtp");
    });

    it("does not fail if no settings file give", () => {
      Meteor.settings = {};
      expect(GlobalSettings.getMailDeliverer()).to.equal("smtp");
    });
  });

  describe("#getSMTPMailUrl", () => {
    it("returns the correct value", () => {
      expect(GlobalSettings.getSMTPMailUrl()).to.equal(
        Meteor.settings.email.smtp.mailUrl,
      );
    });

    it("returns an empty string if property is not set", () => {
      delete Meteor.settings.email.smtp.mailUrl;
      expect(GlobalSettings.getSMTPMailUrl()).to.equal("");
    });

    it("does not fail if no settings file give", () => {
      Meteor.settings = {};
      expect(GlobalSettings.getSMTPMailUrl()).to.equal("");
    });
  });

  describe("#getMailgunSettings", () => {
    it("returns the correct value", () => {
      expect(GlobalSettings.getMailgunSettings()).to.equal(
        Meteor.settings.email.mailgun,
      );
    });

    it("throws exception if property is not set", () => {
      delete Meteor.settings.email.mailgun;

      let exceptionThrown;
      try {
        GlobalSettings.getMailgunSettings();
        exceptionThrown = false;
      } catch (e) {
        exceptionThrown = e instanceof MeteorError;
      }

      expect(exceptionThrown, "Method did not throw exception").to.be.true;
    });
  });
});
