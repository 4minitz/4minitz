const fs = require('fs');
const EJSON = require('mongodb-extended-json');

class ExpImpUsers {
    static get FILENAME_POSTFIX() {
        return "_users.json";
    }
    static get MAPNAME_POSTFIX() {
        return "_userMap.json";
    }

    static doExport (db, msID, userIDsFlat) {
        return new Promise((resolve, reject) => {
            userIDsFlat = Object.keys(userIDsFlat);
            let userIDsOuputMap = {};

            db.collection('users')
                .find({ _id : { $in : userIDsFlat } })
                .toArray()
                .then(allUsersDoc => {
                    if (allUsersDoc) {
                        // userIDsFlat may contain "free text" users that are not in DB
                        // We create a dict to look up which collected userIDs are really from DB
                        let userIDsFromDB = {};
                        allUsersDoc.map(usr => {
                            userIDsFromDB[usr._id] = 1;
                        });
                        const usrFile = msID + ExpImpUsers.FILENAME_POSTFIX;
                        fs.writeFileSync(usrFile, EJSON.stringify(allUsersDoc,null,2));
                        console.log("Saved: "+usrFile + " with "+allUsersDoc.length+" users");

                        // Save mapping file old => new user ID
                        // But only with REAL DB users (skip free text users)
                        userIDsFlat.map(usrID => {
                            if (userIDsFromDB[usrID]) {
                                userIDsOuputMap[usrID] = "ReplaceWithTargetUserID";
                            }
                        });
                        const mapFile = msID + ExpImpUsers.MAPNAME_POSTFIX;
                        fs.writeFileSync(mapFile, EJSON.stringify(userIDsOuputMap,null,2));
                        console.log("Saved: "+mapFile);
                        console.log("       *** IMPORTANT!!! EDIT USER MAP FILE BEFORE IMPORT!!!");

                        resolve(db);
                    } else {
                        return reject ("Could not find users: ", userIDsFlat);
                    }
                 });
        });
    }

    static preImportCheck (db, msID) {
        return new Promise((resolve, reject) => {
            const mapFile = msID + ExpImpUsers.MAPNAME_POSTFIX;
            let usrMap = undefined;
            try {
                usrMap = EJSON.parse(fs.readFileSync(mapFile, 'utf8'));
                if (!usrMap) {
                    return reject("Could not read user map file "+mapFile);
                }
            } catch (e) {
                return reject("Could not read user map file "+mapFile + "\n"+e);
            }
            let usrMapCount = Object.keys(usrMap).length;
            console.log("Found "+usrMapCount+" users in "+mapFile);
            let usrMapTargetIDs = Object.keys(usrMap).map(key => usrMap[key]);

            db.collection('users')
                .find({ _id : { $in : usrMapTargetIDs } })
                .toArray()
                .then(doc => {
                    if (doc) {
                        console.log("Found "+doc.length + " target users in current user DB.");
                        if (doc.length !== usrMapCount) {
                            return reject ("Not all target users found in current user DB: "+usrMapTargetIDs);
                        }
                        resolve({db, usrMap});
                    } else {
                        return reject ("Could not find users: ", usrMapTargetIDs);
                    }
                });
        });
    }

}

module.exports = ExpImpUsers;
