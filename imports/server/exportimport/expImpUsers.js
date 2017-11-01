const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpUsers {
    static getData (db, msID, userIDsFlat) {
        return new Promise((resolve, reject) => {
            userIDsFlat = Object.keys(userIDsFlat);
            db.collection('users')
                .find({ _id : { $in : userIDsFlat } })
                .toArray()
                .then(doc => {
                    if (doc) {
                        const usrFile = msID+"_users.json";
                        fs.writeFileSync(usrFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+usrFile + " with "+doc.length+" users");
                        resolve(db);
                    } else {
                        reject ("Unknown meeting series ID: "+ msID);
                    }
                 });
        });
    }
}

module.exports = ExpImpUsers;
