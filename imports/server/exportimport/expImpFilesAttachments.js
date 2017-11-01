const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpFilesAttachments {
    static get FILENAME_POSTFIX() {
        return "_filesAttachments.json";
    }

    static doExport (db, msID, userIDs) {
        return new Promise((resolve, reject) => {
            db.collection('AttachmentsCollection')
                .find({"meta.parentseries_id": msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const attFile = msID + ExpImpFilesAttachments.FILENAME_POSTFIX;
                        fs.writeFileSync(attFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+attFile + " with "+doc.length+" file attachments");
                        if (doc[0]) {
                            console.log("      *** Hint *** Please manually copy all files below:");
                            console.log("      "+doc[0]._storagePath);
                        }
                        resolve({db, userIDs});
                    } else {
                        return reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpFilesAttachments;
