const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpMeetingSeries {
    static getData (db, msID) {
        return new Promise((resolve, reject) => {
            let userIDs = {};
            db.collection('meetingSeries')
                 .findOne({_id: msID})
                 .then(doc => {
                     if (doc) {
                         const msFile = msID+"_meetingSeries.json";
                         fs.writeFileSync(msFile, EJSON.stringify(doc,null,2));
                         console.log("Saved: "+msFile);
                         doc.visibleFor.map(userID => {
                             userIDs[userID] = 1;
                         });
                         doc.informedUsers.map(userID => {
                             userIDs[userID] = 1;
                         });
                         resolve({db, userIDs});
                     } else {
                         reject ("Unknown meeting series ID: "+ msID);
                     }
                 });
        });
    }
}

module.exports = ExpImpMeetingSeries;
