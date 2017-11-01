const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpMinutes {
    static getData (db, msID, userIDs) {
        return new Promise((resolve, reject) => {
            db.collection('minutes')
                .find({meetingSeries_id: msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const minFile = msID+"_minutes.json";
                        fs.writeFileSync(minFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+minFile + " with "+doc.length+" minutes");

                        // Collect additional invited / informed users from older minutes
                        doc.map(min => {
                            min.visibleFor.map(userID => {      // should be identical to meeting series
                                userIDs[userID] = 1;
                            });
                            min.informedUsers.map(userID => {   // should be identical to meeting series
                                userIDs[userID] = 1;
                            });
                            min.participants.map(part => {      // might differ from meeting series users!
                                userIDs[part.userId] = 1;
                            });
                        });

                        resolve({db, userIDs});
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpMinutes;
