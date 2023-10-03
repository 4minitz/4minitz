import { E2EGlobal } from "./E2EGlobal";

const fs = require("fs-extra");

export class E2EProtocols {
  static setSettingsForProtocolGeneration(format) {
    //Set on server
    server.call("e2e.setSettingsForProtocolGeneration", format);
    //Set on client
    browser.execute((format) => {
      Meteor.settings.public.docGeneration.enabled = Boolean(format);

      if (format) {
        Meteor.settings.public.docGeneration.format = format;
      }
    }, format);
  }

  static countProtocolsInMongoDB() {
    return server.call("e2e.countProtocolsInMongoDB");
  }

  static checkProtocolFileForMinuteExits(minuteId) {
    let path = server.call("e2e.getProtocolStoragePathForMinute", minuteId);

    if (!path) {
      //no protocol record in MongoDB
      return false;
    }
    return fs.existsSync(path);
  }

  static downloadButtonExists() {
    return browser.isVisible(".btn-download");
  }

  static checkDownloadOpensConfirmationDialog() {
    browser.click(".btn-download");
    E2EGlobal.waitSomeTime(750);
    return browser.isVisible("#confirmationDialogOK");
  }

  static getDownloadLinkForProtocolOfMinute(minuteId) {
    return server.call("e2e.getProtocolLinkForMinute", minuteId);
  }
}
