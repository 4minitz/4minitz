const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpMeetingSeries {
    static getData (db, msID) {
        return new Promise((resolve, reject) => {
            db.collection('meetingSeries')
                 .findOne({_id: msID})
                 .then(doc => {
                     if (doc) {
                         const msFile = msID+"_meetingSeries.json";
                         fs.writeFileSync(msFile, EJSON.stringify(doc,null,2));
                         console.log("Saved: "+msFile);
                         resolve({db, msDoc: doc});
                     } else {
                         reject ("Unknown meeting series ID: "+ msID);
                     }
                 });
        });
    }
}

module.exports = ExpImpMeetingSeries;
