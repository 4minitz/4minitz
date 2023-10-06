/*
    Import a meeting series with all depending collection data to multiple
   files. Usage example: node  exportMeetingSeries.js -m
   mongodb://localhost:3101/meteor --id icwrCdJjqWpoH9ugQ
 */

const mongo = require("mongodb").MongoClient;
const ExpImpSchema = require("../imports/server/exportimport/expImpSchema");
const ExpImpMeetingSeries = require("../imports/server/exportimport/expImpMeetingseries");
const ExpImpMinutes = require("../imports/server/exportimport/expImpMinutes");
const ExpImpTopics = require("../imports/server/exportimport/expImpTopics");
const ExpImpFileAttachments = require("../imports/server/exportimport/expImpFilesAttachments");
const ExpImpFileDocuments = require("../imports/server/exportimport/expImpFilesDocuments");
const ExpImpUsers = require("../imports/server/exportimport/expImpUsers");

const optionParser = require("node-getopt").create([
  ["i", "id=[ARG]", "ID of meeting series, e.g. icwrCdJjqWpoH9ugQ"],
  ["m", "mongourl=[ARG]", "Mongo DB url, e.g. mongodb://localhost:3101/meteor"],
  ["f", "force", "Force import even if schema mismatch"],
  ["h", "help", "Display this help"],
]);
const arg = optionParser.bindHelp().parseSystem();
const mongoUrl = arg.options.mongourl || process.env.MONGO_URL;
const meetingseriesID = arg.options.id;
if (!meetingseriesID) {
  optionParser.showHelp();
  console.error("No --id set for meeting series");
  process.exit(1);
}
if (!mongoUrl) {
  optionParser.showHelp();
  console.error("No --mongourl parameter or MONGO_URL in env");
  process.exit(1);
}
const _connectMongo = function (mongoUrl) {
  return new Promise((resolve, reject) => {
    mongo.connect(mongoUrl, (error, db) => {
      if (error) {
        reject(error);
      }
      closeDB = db;
      resolve(db);
    });
  });
};

console.log("");
console.log(
  `*** 4Minitz MeetingSeries Import Tool *** (made for schema version: ${ExpImpSchema.MADE_FOR_SCHEMA})`,
);
console.log("*** ATTENTION ***");
console.log(
  "- This script will import a meeting series and all dependecies to your DB.",
);
console.log(
  "- This script has to change existing user roles, so users can access the new data.",
);
console.log(
  "- This script may overwrite edited data if you import the same data multiple times.",
);
console.log("So, this script is DANGEROUS!!!");
console.log("Experts only!");
console.log("Seriously!");
console.log("");
console.log("TL;DR - Make sure you have a backup!");
console.log("        e.g.: mongodump -h 127.0.0.1 --port 3101 -d meteor");
console.log("");
console.log("Press ENTER to continue - or Ctrl+C to quit...");
require("child_process").spawnSync("read _ ", {
  shell: true,
  stdio: [0, 1, 2],
});

var closeDB = undefined;
_connectMongo(mongoUrl)
  .then((db) => {
    return ExpImpSchema.preImportCheck(db, meetingseriesID, arg.options.force);
  })
  .then((db) => {
    return ExpImpUsers.preImportCheck(db, meetingseriesID);
  })
  .then(({ db, usrMap }) => {
    return ExpImpMeetingSeries.doImport(db, meetingseriesID, usrMap);
  })
  .then(({ db, usrMap }) => {
    return ExpImpMinutes.doImport(db, meetingseriesID, usrMap);
  })
  .then(({ db, usrMap }) => {
    return ExpImpTopics.doImport(db, meetingseriesID, usrMap);
  })
  .then(({ db, usrMap }) => {
    return ExpImpFileAttachments.doImport(db, meetingseriesID, usrMap);
  })
  .then(({ db, usrMap }) => {
    return ExpImpFileDocuments.doImport(db, meetingseriesID, usrMap);
  })
  .then(({ db, usrMap }) => {
    return ExpImpUsers.doImport(db, meetingseriesID, usrMap);
  })
  .then((db) => closeDB.close())
  .catch((error) => {
    console.log(`Error: ${error}`);
    console.log("Press Ctrl+C to stop.");
  });
