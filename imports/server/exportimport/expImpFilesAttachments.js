const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpFilesAttachments {
    static getData (db, msID) {
        return new Promise((resolve, reject) => {
            db.collection('AttachmentsCollection')
                .find({"meta.parentseries_id": msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const attFile = msID+"_filesAttachments.json";
                        fs.writeFileSync(attFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+attFile + " with "+doc.length+" file attachments");
                        resolve(db);
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpFilesAttachments;
