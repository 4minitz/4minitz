const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpMeetingSeries {
    static get FILENAME_POSTFIX() {
        return '_meetingSeries.json';
    }

    static doExport (db, msID) {
        return new Promise((resolve, reject) => {
            let userIDs = {};
            db.collection('meetingSeries')
                .findOne({_id: msID})
                .then(doc => {
                    if (doc) {
                        const msFile = msID + ExpImpMeetingSeries.FILENAME_POSTFIX;
                        fs.writeFileSync(msFile, EJSON.stringify(doc,null,2));
                        console.log('Saved: '+msFile);
                        doc.visibleFor && doc.visibleFor.map(userID => {
                            userIDs[userID] = 1;
                        });
                        doc.informedUsers && doc.informedUsers.map(userID => {
                            userIDs[userID] = 1;
                        });
                        resolve({db, userIDs});
                    } else {
                        return reject ('Unknown meeting series ID: '+ msID);
                    }
                });
        });
    }


    static doImport (db, msID, usrMap) {
        return new Promise((resolve, reject) => {
            db.collection('meetingSeries')
                .findOne({_id: msID})
                .then(doc => {
                    if (doc) {
                        return reject ('Meeting series with ID: '+ msID+' already exists. Cannot import.');
                    } else {
                        const msFile = msID + ExpImpMeetingSeries.FILENAME_POSTFIX;
                        let msDoc = undefined;
                        try {
                            msDoc = EJSON.parse(fs.readFileSync(msFile, 'utf8'));
                            if (!msDoc) {
                                return reject('Could not read meeting series file '+msFile);
                            }
                        } catch (e) {
                            return reject('Could not read meeting series file '+msFile);
                        }

                        // Replace old user IDs with new users IDs
                        for (let i=0; i<msDoc.visibleFor.length; i++) {
                            msDoc.visibleFor[i] = usrMap[msDoc.visibleFor[i]];
                        }
                        for (let i=0; i<msDoc.informedUsers.length; i++) {
                            msDoc.informedUsers[i] = usrMap[msDoc.informedUsers[i]];
                        }

                        return db.collection('meetingSeries')
                            .insert(msDoc)
                            .then(function (res) {
                                if (res.result.ok === 1) {
                                    console.log('OK, inserted meeting series with ID: '+msID);
                                    resolve({db, usrMap});
                                } else {
                                    reject('Could not insert meeting series with ID: '+msID);
                                }
                            });
                    }
                });
        });
    }
}

module.exports = ExpImpMeetingSeries;
