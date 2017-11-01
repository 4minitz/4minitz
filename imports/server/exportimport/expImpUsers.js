const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpUsers {
    static getData (db, msID, userIDsFlat) {
        return new Promise((resolve, reject) => {
            userIDsFlat = Object.keys(userIDsFlat);
            let userIDsMap = {};

            db.collection('users')
                .find({ _id : { $in : userIDsFlat } })
                .toArray()
                .then(doc => {
                    if (doc) {
                        const usrFile = msID+"_users.json";
                        fs.writeFileSync(usrFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+usrFile + " with "+doc.length+" users");

                        // Save mapping file old => new user ID
                        userIDsFlat.map(usrID => {
                            userIDsMap[usrID] = "-replace-with-target-user-ID-";
                        });
                        const mapFile = msID+"_userMap.json";
                        fs.writeFileSync(mapFile, EJSON.stringify(userIDsMap,null,2));
                        console.log("Saved: "+mapFile);
                        console.log("       *** IMPORTANT!!! EDIT USER MAP FILE BEFORE IMPORT!!!");

                        resolve(db);
                    } else {
                        reject ("Could not find users: ", userIDsFlat);
                    }
                 });
        });
    }
}

module.exports = ExpImpUsers;
