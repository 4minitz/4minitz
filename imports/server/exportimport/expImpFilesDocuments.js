const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpFilesDocuments {
    static getData (db, msID, userIDs) {
        return new Promise((resolve, reject) => {
            db.collection('DocumentsCollection')
                .find({"meta.meetingSeriesId": msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const docFile = msID+"_filesDocuments.json";
                        fs.writeFileSync(docFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+docFile + " with "+doc.length+" protocol documents");
                        if (doc[0]) {
                            console.log("      *** Hint *** Please manually copy all files below:");
                            console.log("      "+doc[0]._storagePath.substr(0, doc[0]._storagePath.lastIndexOf("/")));
                        }
                        resolve({db, userIDs});
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpFilesDocuments;
