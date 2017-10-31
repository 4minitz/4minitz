const fs = require('fs');

class ExpImpMinutes {
    static getData (db, msDoc) {
        return new Promise((resolve, reject) => {
            const msID = msDoc._id;
            db.collection('minutes')
                .find({meetingSeries_id: msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const minFile = msID+"_minutes.json";
                        fs.writeFileSync(minFile, JSON.stringify(doc,null,2));
                        console.log("Saved: "+minFile + " with "+doc.length+" minutes");
                        resolve({db, msDoc: msDoc});
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpMinutes;
