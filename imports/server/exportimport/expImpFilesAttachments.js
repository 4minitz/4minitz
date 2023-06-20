const fs = require('fs');
const EJSON = require('bson');

class ExpImpFilesAttachments {
    static get FILENAME_POSTFIX() {
        return '_filesAttachments.json';
    }

    static doExport (db, msID, userIDs) {
        return new Promise((resolve, reject) => {
            db.collection('AttachmentsCollection')
                .find({'meta.parentseries_id': msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const attFile = msID + ExpImpFilesAttachments.FILENAME_POSTFIX;
                        fs.writeFileSync(attFile, EJSON.stringify(doc,null,2));
                        console.log('Saved: '+attFile + ' with '+doc.length+' file attachments');
                        if (doc[0]) {
                            console.log('      *** Hint *** Please manually copy all files below:');
                            console.log('      '+doc[0]._storagePath);
                        }
                        resolve({db, userIDs});
                    } else {
                        return reject ('Unknown meeting series ID: '+ msID);
                    }
                });
        });
    }

    static doImport (db, msID, usrMap) {
        return new Promise((resolve, reject) => {
            const attachmentFile = msID + ExpImpFilesAttachments.FILENAME_POSTFIX;
            let AllAttachmentsDoc = undefined;
            try {
                AllAttachmentsDoc = EJSON.parse(fs.readFileSync(attachmentFile, 'utf8'));
                if (!AllAttachmentsDoc) {
                    return reject('Could not read attachment file '+attachmentFile);
                }
            } catch (e) {
                return reject('Could not read attachment file '+attachmentFile+'\n'+e);
            }

            // Replace old user IDs with new users IDs
            let attachmentIDs = [];
            for(let a=0; a<AllAttachmentsDoc.length; a++) {
                attachmentIDs.push(AllAttachmentsDoc[a]._id);
                AllAttachmentsDoc[a] = ExpImpFilesAttachments.patchUsers(AllAttachmentsDoc[a], usrMap);
            }


            return db.collection('AttachmentsCollection')
                .deleteMany({ _id : { $in : attachmentIDs } })     // delete existing attachments with same IDs
                .then(function (res) {
                    if (res.result && ! res.result.ok) {
                        console.log(res);
                    }
                    return db.collection('AttachmentsCollection')
                        .insertMany(AllAttachmentsDoc)                         // insert imported minutes
                        .then(function (res) {
                            if (res.result.ok === 1 && res.result.n === AllAttachmentsDoc.length) {
                                console.log('OK, inserted '+res.result.n+' attachments meta data.');
                                resolve({db, usrMap});
                            } else {
                                reject('Could not insert attachment meta data');
                            }
                        });
                });
        });
    }

    static patchUsers(attachmentDoc, usrMap) {
        if (usrMap[attachmentDoc.userId]) {
            attachmentDoc.userId = usrMap[attachmentDoc.userId];
        }
        return attachmentDoc;
    }
}

module.exports = ExpImpFilesAttachments;
