const fs = require('fs');

class ExpImpMeetingSeries {
    static getData (db, msID) {
        return new Promise((resolve, reject) => {
            db.collection('meetingSeries')
                 .findOne({_id: msID})
                 .then(doc => {
                     if (doc) {
                         const msFile = msID+"_meetingSeries.json";
                         fs.writeFileSync(msFile, JSON.stringify(doc,null,2));
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
