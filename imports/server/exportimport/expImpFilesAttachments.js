const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpFilesAttachments {
    static getData (db, msID, userIDs) {
        return new Promise((resolve, reject) => {
            db.collection('AttachmentsCollection')
                .find({"meta.parentseries_id": msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const attFile = msID+"_filesAttachments.json";
                        fs.writeFileSync(attFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+attFile + " with "+doc.length+" file attachments");
                        if (doc[0]) {
                            console.log("      *** Hint *** Please manually copy all files below:");
                            console.log("      "+doc[0]._storagePath);
                        }
                        resolve({db, userIDs});
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpFilesAttachments;
