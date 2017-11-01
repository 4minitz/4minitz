const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpTopics {
    static getData (db, msDoc) {
        return new Promise((resolve, reject) => {
            const msID = msDoc._id;
            db.collection('topics')
                .find({parentId: msID})
                .toArray()
                .then(doc => {
                    if (doc) {
                        const topFile = msID+"_topics.json";
                        fs.writeFileSync(topFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+topFile + " with "+doc.length+" topics");
                        resolve(db);
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpTopics;
