import { formatDateISO8601 } from "/imports/helpers/date";
import { Meteor } from "meteor/meteor";

let packagejson;
try {
  // The 4minitz package.json is not available after build
  // so let's see, if we have a copy saved...
  packagejson = require("/package4min.json");
} catch (e) {
  packagejson = require("/package.json"); // generic fall back
}

export const VERSION_INFO = {
  tag: packagejson.version ? packagejson.version : "???",
  branch: packagejson["4minitz"]["4m_branch"]
    ? packagejson["4minitz"]["4m_branch"]
    : "???",
  commitlong: packagejson["4minitz"]["4m_commitlong"]
    ? packagejson["4minitz"]["4m_commitlong"]
    : "???",
  commitshort: packagejson["4minitz"]["4m_commitshort"]
    ? packagejson["4minitz"]["4m_commitshort"]
    : "???",
  date: packagejson["4minitz"]["4m_releasedate"]
    ? packagejson["4minitz"]["4m_releasedate"]
    : "",
};

Meteor.methods({
  gitVersionInfo() {
    // #Security: not logged in users should not know version of server
    return this.userId ? VERSION_INFO : undefined;
  },

  gitVersionInfoUpdate() {
    try {
      const git = require("git-rev-sync");
      VERSION_INFO.commitshort = git.short();
      VERSION_INFO.commitlong = git.long();
      VERSION_INFO.branch = git.branch();
      VERSION_INFO.tag = git.tag();
      VERSION_INFO.date = formatDateISO8601(git.date());
      if (VERSION_INFO.tag === VERSION_INFO.commitlong) {
        // no tag found!
        delete VERSION_INFO.tag;
      }
      if (VERSION_INFO.branch.startsWith("Detached")) {
        VERSION_INFO.branch = "Specific Commit";
      }
    } catch (e) {
      // silently swallow git-rev-sync errors
      // we have version fallback info from package.json
    }
  },
});

// initialize versioning once on server launch
Meteor.call("gitVersionInfoUpdate");
console.log(`Version: ${JSON.stringify(VERSION_INFO, null, 4)}`);
