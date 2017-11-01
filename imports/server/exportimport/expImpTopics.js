const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpTopics {
    static get FILENAME_POSTFIX() {
        return "_topics.json";
    }

    static doExport (db, msID, userIDs) {
        return new Promise((resolve, reject) => {
            db.collection('topics')
                .find({parentId: msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const topFile = msID + ExpImpTopics.FILENAME_POSTFIX;
                        fs.writeFileSync(topFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+topFile + " with "+doc.length+" topics");
                        resolve({db, userIDs});
                    } else {
                        return reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }

    static doImport (db, msID, usrMap) {
        return new Promise((resolve, reject) => {
            const minFile = msID + ExpImpMinutes.FILENAME_POSTFIX;
            let minDoc = undefined;
            try {
                minDoc = EJSON.parse(fs.readFileSync(minFile, 'utf8'));
                if (!minDoc) {
                    return reject("Could not read minutes file "+minFile);
                }
            } catch (e) {
                return reject("Could not read minutes file "+minFile);
            }

            // Replace old user IDs with new users IDs
            let minIDs = [];
            for (let m = 0; m<minDoc.length; m++) {                 // iterate all minutes
                minIDs.push(minDoc[m]._id);
                for (let i=0; minDoc[m].visibleFor&&i<minDoc[m].visibleFor.length; i++) {
                    minDoc[m].visibleFor[i] = usrMap[minDoc[m].visibleFor[i]];
                }
                for (let i=0; minDoc[m].informedUsers&&i<minDoc[m].informedUsers.length; i++) {
                    minDoc[m].informedUsers[i] = usrMap[minDoc[m].informedUsers[i]];
                }
                for (let i=0; minDoc[m].participants&&i<minDoc[m].participants.length; i++) {
                    minDoc[m].participants[i].userId = usrMap[minDoc[m].participants[i].userId];
                }
            }

            return db.collection('minutes')
                .deleteMany({ _id : { $in : minIDs } })     // delete existing minutes with same IDs
                .then(function (res) {
                    return db.collection('minutes')
                        .insertMany(minDoc)                         // insert imported minutes
                        .then(function (res) {
                            if (res.result.ok === 1 && res.result.n === minDoc.length) {
                                console.log("OK, inserted "+res.result.n+" meeting minutes.");
                                resolve(db);
                            } else {
                                reject("Could not insert meeting minutes");
                            }
                        });
                });
        });
    }


    static patchUsers(topicDoc, usrMap) {
        // patch topic-responsibles
        for (let i=0; topicDoc.responsibles&&i<topicDoc.responsibles.length; i++) {
            if (usrMap[topicDoc.responsibles[i]]) {  // may be "free text" user
                topicDoc.responsibles[i] = usrMap[topicDoc.responsibles[i]];
            }
        }
        // patch topic-actionitem-responsibles
        for (let i=0; topicDoc.infoItems&&i<topicDoc.infoItems.length; i++) {
            for (let j=0; topicDoc.infoItems[i].responsibles&&j<topicDoc.infoItems[i].responsibles.length; j++) {
                if (usrMap[topicDoc.infoItems[i].responsibles[j]]) {  // may be "free text" user
                    topicDoc.infoItems[i].responsibles[j] = usrMap[topicDoc.infoItems[i].responsibles[j]];
                }
            }
        }
        return topicDoc;
    }
}

module.exports = ExpImpTopics;
