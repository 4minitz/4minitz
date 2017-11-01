
// Hinweis auf Attachments!

let mongo = require('mongodb').MongoClient;
let ExpImpSchema = require('../imports/server/exportimport/expImpSchema');
let ExpImpMeetingSeries = require('../imports/server/exportimport/expImpMeetingseries');
let ExpImpMinutes = require('../imports/server/exportimport/expImpMinutes');
let ExpImpTopics = require('../imports/server/exportimport/expImpTopics');
let ExpImpFileAttachments = require('../imports/server/exportimport/expImpFilesAttachments');
let ExpImpFileDocuments = require('../imports/server/exportimport/expImpFilesDocuments');

let optionParser = require('node-getopt').create([
    ['i', 'id=[ARG]', 'ID of meeting series'],
    ['m', 'mongourl=[ARG]', 'Mongo DB url'],
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


_connectMongo(mongoUrl)
    .then(db            => {return ExpImpSchema.exportCheck(db, meetingseriesID);})
    .then(db            => {return ExpImpMeetingSeries.getData(db, meetingseriesID);})
    .then(({db, msDoc}) => {return ExpImpMinutes.getData(db, msDoc);})
    .then(({db, msDoc}) => {return ExpImpTopics.getData(db, msDoc);})
    .then(db            => {return ExpImpFileAttachments.getData(db, meetingseriesID);})
    .then(db            => {return ExpImpFileDocuments.getData(db, meetingseriesID);})
    .then(db            => db.close())
    .catch(error => {
        console.log("Error: "+error);
        console.log("Press Ctrl+C to stop.");
    });
