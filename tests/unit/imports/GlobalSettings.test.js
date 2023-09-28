import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

class MeteorError {}
let Meteor = {
  Error: MeteorError,
  absoluteUrl: (path, config) => {
    if (!path) path = "";

    if (config?.rootUrl) {
      if (path !== "") path = "/" + path;
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

describe("GlobalSettings", function () {
  beforeEach("publish public settings", function () {
    Meteor.settings = require("../../../settings_sample.json");
    GlobalSettings.publishSettings();
  });

  describe("#getRootUrl", function () {
    it("returns the correct value", function () {
      expect(GlobalSettings.getRootUrl()).to.equal(Meteor.settings.ROOT_URL);
    });

    it("returns an empty string if property is not set", function () {
      delete Meteor.settings.ROOT_URL;
      expect(GlobalSettings.getRootUrl()).to.equal("");
    });

    it("does not fail if no settings file give", function () {
      Meteor.settings = {};
      expect(GlobalSettings.getRootUrl()).to.equal("");
    });
  });

  describe("#isTrustedIntranetInstallation", function () {
    it("returns the correct value", function () {
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.equal(
        Meteor.settings.trustedIntranetInstallation,
      );
    });

    it("returns false if property is not set", function () {
      delete Meteor.settings.trustedIntranetInstallation;
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.be.false;
    });

    it("does not fail if no settings file give", function () {
      Meteor.settings = {};
      expect(GlobalSettings.isTrustedIntranetInstallation()).to.be.false;
    });
  });

  describe("#getDefaultEmailSenderAddress", function () {
    it("returns the default email sender address", function () {
      expect(GlobalSettings.getDefaultEmailSenderAddress()).to.equal(
        Meteor.settings.email.defaultEMailSenderAddress,
      );
    });

    it("returns the alternative address of the current user if property is left empty", function () {
      Meteor.settings.email.defaultEMailSenderAddress = "";
      let alternative = "alternativeSenderAddress";
      expect(GlobalSettings.getDefaultEmailSenderAddress(alternative)).to.equal(
        alternative,
      );
    });

    it("returns fallback sender address if no alternative address is given", function () {
      Meteor.settings.email.defaultEMailSenderAddress = "";
      expect(GlobalSettings.getDefaultEmailSenderAddress()).to.equal(
        Meteor.settings.email.fallbackEMailSenderAddress,
      );
    });

    it("throws exception if fallback sender address required but not given", function () {
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

    it("throws exception if property is not set", function () {
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

  describe("#isEMailDeliveryEnabled", function () {
    it("returns the correct value", function () {
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.equal(
        Meteor.settings.email.enableMailDelivery,
      );
    });

    it("returns false if property is not set", function () {
      delete Meteor.settings.email.enableMailDelivery;
      GlobalSettings.publishSettings();
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.be.false;
    });

    it("does not fail if no settings file give", function () {
      Meteor.settings = {};
      expect(GlobalSettings.isEMailDeliveryEnabled()).to.be.false;
    });
  });

  describe("#getMailDeliverer", function () {
    it("returns the correct value", function () {
      expect(GlobalSettings.getMailDeliverer()).to.equal(
        Meteor.settings.email.mailDeliverer,
      );
    });

    it("returns smtp if property is not set", function () {
      delete Meteor.settings.email.mailDeliverer;
      expect(GlobalSettings.getMailDeliverer()).to.equal("smtp");
    });

    it("does not fail if no settings file give", function () {
      Meteor.settings = {};
      expect(GlobalSettings.getMailDeliverer()).to.equal("smtp");
    });
  });

  describe("#getSMTPMailUrl", function () {
    it("returns the correct value", function () {
      expect(GlobalSettings.getSMTPMailUrl()).to.equal(
        Meteor.settings.email.smtp.mailUrl,
      );
    });

    it("returns an empty string if property is not set", function () {
      delete Meteor.settings.email.smtp.mailUrl;
      expect(GlobalSettings.getSMTPMailUrl()).to.equal("");
    });

    it("does not fail if no settings file give", function () {
      Meteor.settings = {};
      expect(GlobalSettings.getSMTPMailUrl()).to.equal("");
    });
  });

  describe("#getMailgunSettings", function () {
    it("returns the correct value", function () {
      expect(GlobalSettings.getMailgunSettings()).to.equal(
        Meteor.settings.email.mailgun,
      );
    });

    it("throws exception if property is not set", function () {
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
