const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpFilesDocuments {
    static getData (db, msID) {
        return new Promise((resolve, reject) => {
            db.collection('DocumentsCollection')
                .find({"meta.meetingSeriesId": msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const docFile = msID+"_filesDocuments.json";
                        fs.writeFileSync(docFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+docFile + " with "+doc.length+" protocol documents");
                        resolve(db);
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpFilesDocuments;
