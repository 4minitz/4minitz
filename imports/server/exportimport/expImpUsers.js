const fs = require("fs");
const EJSON = require("bson");

class ExpImpUsers {
  static get FILENAME_POSTFIX() {
    return "_users.json";
  }
  static get MAPNAME_POSTFIX() {
    return "_userMap.json";
  }

  static searchUser(allUserDoc, searchID) {
    for (let i = 0; i < allUserDoc.length; i++) {
      if (allUserDoc[i]._id === searchID) {
        return allUserDoc[i];
      }
    }
    throw Error(`Could not find user with _id:${searchID}`);
  }

  static doExport(db, msID, userIDsFlat) {
    return new Promise((resolve, reject) => {
      userIDsFlat = Object.keys(userIDsFlat);
      const userIDsOuputMap = {};

      db.collection("users")
        .find({ _id: { $in: userIDsFlat } })
        .toArray()
        .then((allUsersDoc) => {
          if (allUsersDoc) {
            // userIDsFlat may contain "free text" users that are not in DB
            // We create a dict to look up which collected userIDs are really
            // from DB
            const userIDsFromDB = {};
            allUsersDoc.map((usr) => {
              userIDsFromDB[usr._id] = 1;
            });
            const usrFile = msID + ExpImpUsers.FILENAME_POSTFIX;
            fs.writeFileSync(usrFile, EJSON.stringify(allUsersDoc, null, 2));
            console.log(`Saved: ${usrFile} with ${allUsersDoc.length} users`);

            // Save mapping file old => new user ID
            // But only with REAL DB users (skip free text users)
            userIDsFlat.map((usrID) => {
              if (userIDsFromDB[usrID]) {
                // default: newID === oldID
                // This means, users are copied(!) from source DB to
                // destination DB If newID is changed to an existing id from
                // destination ID, this target user is used
                const thisUser = ExpImpUsers.searchUser(allUsersDoc, usrID);
                userIDsOuputMap[usrID] = {
                  newID: usrID,
                  hint: `${thisUser.username} ${thisUser.profile.name}`,
                };
              }
            });
            const mapFile = msID + ExpImpUsers.MAPNAME_POSTFIX;
            fs.writeFileSync(mapFile, JSON.stringify(userIDsOuputMap, null, 2));
            console.log(`Saved: ${mapFile}`);
            console.log(
              "       *** IMPORTANT!!! EDIT USER MAP FILE BEFORE IMPORT!!!",
            );

            resolve(db);
            return;
          }
          return reject("Could not find users: ", userIDsFlat);
        });
    });
  }

  static preImportCheck(db, msID) {
    return new Promise((resolve, reject) => {
      const mapFile = msID + ExpImpUsers.MAPNAME_POSTFIX;
      let usrMap = undefined;
      try {
        usrMap = JSON.parse(fs.readFileSync(mapFile, "utf8"));
        if (!usrMap) {
          return reject(`Could not read user map file ${mapFile}`);
        }
      } catch (e) {
        return reject(`Could not read user map file ${mapFile}\n${e}`);
      }
      const usrMapSimple = {}; // make flat map: oldID => newID
      usrMap = Object.keys(usrMap).map((key) => {
        usrMapSimple[key] = usrMap[key].newID;
      });
      usrMap = usrMapSimple;

      const usrMapCount = Object.keys(usrMap).length;
      console.log(`Found ${usrMapCount} users in ${mapFile}`);
      const usrMapTargetIDs = [];
      const usrCopyIDs = [];
      Object.keys(usrMap).map((key) => {
        if (key === usrMap[key]) {
          usrCopyIDs.push(key); // copy user from export DB => import DB
        } else {
          // key/value different...
          usrMapTargetIDs.push(usrMap[key]); // map to existing user
        }
      });

      // Check#1: All "link targets" should exist
      db.collection("users")
        .find({ _id: { $in: usrMapTargetIDs } })
        .toArray()
        .then((doc) => {
          if (doc) {
            console.log(`Found ${doc.length} target users in current user DB.`);
            console.log(
              "Will copy over " +
                usrCopyIDs.length +
                " export users to current user DB.",
            );
            if (doc.length !== usrMapTargetIDs.length) {
              return reject(
                "Not all to-be patched target users found in current user DB: " +
                  usrMapTargetIDs,
              );
            }
            // Check#2: All copy-users MUST NOT exist!
            db.collection("users")
              .find({ _id: { $in: usrCopyIDs } })
              .toArray()
              .then((shouldBeEmpty) => {
                if (shouldBeEmpty && shouldBeEmpty.length > 0) {
                  const errorUsers = shouldBeEmpty.map((usr) => {
                    return { _id: usr._id, username: usr.username };
                  });
                  return reject(
                    shouldBeEmpty.length +
                      " to-be copied user(s) already exists:\n" +
                      JSON.stringify(errorUsers),
                  );
                }
                resolve({ db, usrMap });
              });
            return;
          }
          return reject("Could not find users: ", usrMapTargetIDs);
        });
    });
  }

  static doImport(db, msID, usrMap) {
    return new Promise((resolve, reject) => {
      const usrFile = msID + ExpImpUsers.FILENAME_POSTFIX;
      let allUsersDoc = undefined;
      try {
        allUsersDoc = EJSON.parse(fs.readFileSync(usrFile, "utf8"));
        if (!allUsersDoc) {
          return reject(`Could not read user file ${usrFile}`);
        }
      } catch (e) {
        return reject(`Could not read user file ${usrFile}\n${e}`);
      }

      // We have some sequential DB inserts/updates from two cases now.
      // We chain them in a Promise chain.
      const promiseChain = [];
      for (let u = 0; u < allUsersDoc.length; u++) {
        if (allUsersDoc[u]._id === usrMap[allUsersDoc[u]._id]) {
          // before/after ID are same in mapping file!
          const roleValueForMS = allUsersDoc[u].roles[msID]; // Case#1: clone this user from source
          // DB => target DB!
          allUsersDoc[u].roles = {
            msID: roleValueForMS,
          }; // Kill all other roles, just keep the one for this MS
          promiseChain.push(db.collection("users").insert(allUsersDoc[u]));
        } else {
          promiseChain.push(
            // Case#2: only update user role for existing user in target DB
            db
              .collection("users")
              .findOne({
                _id: usrMap[allUsersDoc[u]._id],
              }) // find the user in target DB
              .then((usr) => {
                const roleValueForMS = allUsersDoc[u].roles[msID];
                if (!(roleValueForMS && roleValueForMS.length > 0)) {
                  return;
                }
                // user needs role for import meeting series?
                const roles = usr.roles ? usr.roles : {};
                roles[msID] = roleValueForMS;
                return db
                  .collection("users") // upsert role field
                  .update({ _id: usr._id }, { $set: { roles } });
              }),
          );
        }
      }

      // Now execute the chain.
      Promise.all(promiseChain)
        .then((res) => {
          if (res?.[0] && res[0].result && !res[0].result.ok) {
            console.log("Promisechain result: ", res);
          }
          resolve(db);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

module.exports = ExpImpUsers;
