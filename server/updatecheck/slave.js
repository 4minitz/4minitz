import semver from "semver"; // npm module
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { HTTP } from "meteor/http";
import { VERSION_INFO } from "/imports/gitversioninfo";
import { ServerCollection } from "/imports/collections/server_private";
import { AdminNewVersionMailHandler } from "/imports/mail/AdminNewVersionMailHandler";

const UPDATECHECK_INTERVAL_MINUTES = 8 * 60;
// Make sure this instance has an anonymous server UID
let myServerID = ServerCollection.findOne({ key: "serverUID" });
if (!myServerID) {
  myServerID = {
    key: "serverUID",
    value: Random.id(),
  };
  ServerCollection.insert(myServerID);
}
let myVersion = VERSION_INFO.tag;
const url = `https://www.4minitz.com/version/updatecheck/${myServerID.value}/${myVersion}`;
let updateCheck = function (forceReport) {
  HTTP.get(url, {}, function (error, result) {
    if (error || !result.data || !result.data.tag) {
      // Swallow silently.
      // If we can't check the version - we will not bother the admin...
      return;
    }
    let masterVersion = result.data.tag;
    let masterMessage = result.data.message;
    if (semver.lt(myVersion, masterVersion)) {
      // did we already inform about this specific masterVersion?
      let lastReported = ServerCollection.findOne({
        key: "lastReportedVersion",
      });
      let lastReportedVersion = "0.0.0";
      if (lastReported) {
        lastReportedVersion = lastReported.value;
      }

      // only report, if forced or we have not yet reported for this new master version
      if (forceReport || masterVersion !== lastReportedVersion) {
        console.log("*** ATTENTION ***");
        console.log("    Your 4Minitz version seems outdated.");
        console.log(`    Your version    : ${myVersion}`);
        console.log(`    Official version: ${masterVersion}`);
        console.log("    Official message: ", masterMessage);
        console.log(
          "    Please visit: https://github.com/4minitz/4minitz/releases",
        );
        console.log(" ");
        ServerCollection.update(
          { key: "lastReportedVersion" },
          { key: "lastReportedVersion", value: masterVersion },
          { upsert: true },
        );
        try {
          let mailer = new AdminNewVersionMailHandler(
            myVersion,
            masterVersion,
            masterMessage,
          );
          mailer.send();
        } catch (e) {
          console.log("Could not send 'New version exists' eMail.");
          console.log(e);
        }
      }
    }
  });
  Meteor.setTimeout(updateCheck, UPDATECHECK_INTERVAL_MINUTES * 60 * 1000); // call myself regularly
};

// Admin may disable updateCheck by settings.json globally via:
// "updateCheck": false,
if (Meteor.settings.updateCheck !== false) {
  updateCheck(true); // call first time at server start - with "forceReport"
}
