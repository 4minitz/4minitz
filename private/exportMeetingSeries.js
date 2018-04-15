/*
    Export a meeting series with all depending collection data to multiple files.
    Usage example:
                    node  exportMeetingSeries.js -m mongodb://localhost:3101/meteor --id icwrCdJjqWpoH9ugQ
 */

let mongo = require('mongodb').MongoClient;
let ExpImpSchema = require('../imports/server/exportimport/expImpSchema');
let ExpImpMeetingSeries = require('../imports/server/exportimport/expImpMeetingseries');
let ExpImpMinutes = require('../imports/server/exportimport/expImpMinutes');
let ExpImpTopics = require('../imports/server/exportimport/expImpTopics');
let ExpImpFileAttachments = require('../imports/server/exportimport/expImpFilesAttachments');
let ExpImpFileDocuments = require('../imports/server/exportimport/expImpFilesDocuments');
let ExpImpUsers = require('../imports/server/exportimport/expImpUsers');

let optionParser = require('node-getopt').create([
    ['i', 'id=[ARG]', 'ID of meeting series, e.g. icwrCdJjqWpoH9ugQ'],
    ['m', 'mongourl=[ARG]', 'Mongo DB url, e.g. mongodb://localhost:3101/meteor'],
    ['h', 'help', 'Display this help']
]);
let arg = optionParser.bindHelp().parseSystem();
let mongoUrl = arg.options.mongourl || process.env.MONGO_URL;
let meetingseriesID = arg.options.id;
if (!meetingseriesID) {
    optionParser.showHelp();
    console.error('No --id set for meeting series');
    process.exit(1);
}
if (!mongoUrl) {
    optionParser.showHelp();
    console.error('No --mongourl parameter or MONGO_URL in env');
    process.exit(1);
}
let _connectMongo = function (mongoUrl) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongoUrl, (error, db) => {
            if (error) {
                reject(error);
            }
            resolve(db);
        });
    });
};

console.log("");
console.log("*** 4Minitz MeetingSeries Export Tool *** (made for schema version: "+ExpImpSchema.MADE_FOR_SCHEMA+")");
_connectMongo(mongoUrl)
    .then(db              => {return ExpImpSchema.exportCheck(db, meetingseriesID);})
    .then(db              => {return ExpImpMeetingSeries.doExport(db, meetingseriesID);})
    .then(({db, userIDs}) => {return ExpImpMinutes.doExport(db, meetingseriesID, userIDs);})
    .then(({db, userIDs}) => {return ExpImpTopics.doExport(db, meetingseriesID, userIDs);})
    .then(({db, userIDs}) => {return ExpImpFileAttachments.doExport(db, meetingseriesID, userIDs);})
    .then(({db, userIDs}) => {return ExpImpFileDocuments.doExport(db, meetingseriesID, userIDs);})
    .then(({db, userIDs}) => {return ExpImpUsers.doExport(db, meetingseriesID, userIDs);})
    .then(db            => db.close())
    .catch(error => {
        console.log("Error: "+error);
        console.log("Press Ctrl+C to stop.");
    });
