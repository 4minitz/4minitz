const fs = require('fs');

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
                        fs.writeFileSync(topFile, JSON.stringify(doc,null,2));
                        console.log("Saved: "+topFile + " with "+doc.length+" topics");
                        resolve({db, msDoc: msDoc});
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpTopics;
