const fs = require("fs");
const EJSON = require("bson");
let ExpImpTopics = require("./expImpTopics");

class ExpImpMinutes {
  static get FILENAME_POSTFIX() {
    return "_minutes.json";
  }

  static doExport(db, msID, userIDs) {
    return new Promise((resolve, reject) => {
      db.collection("minutes")
        .find({ meetingSeries_id: msID })
        .toArray()
        .then((allMinutesDoc) => {
          if (allMinutesDoc) {
            const minFile = msID + ExpImpMinutes.FILENAME_POSTFIX;
            fs.writeFileSync(minFile, EJSON.stringify(allMinutesDoc, null, 2));
            console.log(
              "Saved: " +
                minFile +
                " with " +
                allMinutesDoc.length +
                " minutes",
            );

            // Collect additional invited / informed users from older minutes
            allMinutesDoc.map((min) => {
              min.visibleFor?.map((userID) => {
                // should be identical to meeting series
                userIDs[userID] = 1;
              });
              min.informedUsers?.map((userID) => {
                // should be identical to meeting series
                userIDs[userID] = 1;
              });
              min.participants?.map((part) => {
                // might differ from meeting series users!
                userIDs[part.userId] = 1;
              });
              min.topics?.map((top) => {
                // iterate topics
                top.responsibles?.map((resp) => {
                  // topic-responsibles
                  userIDs[resp] = 1;
                });
                top.infoItems?.map((item) => {
                  // topic-actionitem-responsibles
                  item.responsibles?.map((resp) => {
                    userIDs[resp] = 1;
                  });
                });
              });
            });

            resolve({ db, userIDs });
          } else {
            return reject("Unknown meeting series ID: " + msID);
          }
        });
    });
  }

  static doImport(db, msID, usrMap) {
    return new Promise((resolve, reject) => {
      const minFile = msID + ExpImpMinutes.FILENAME_POSTFIX;
      let minDoc = undefined;
      try {
        minDoc = EJSON.parse(fs.readFileSync(minFile, "utf8"));
        if (!minDoc) {
          return reject("Could not read minutes file " + minFile);
        }
      } catch (e) {
        return reject("Could not read minutes file " + minFile + "\n" + e);
      }

      // Replace old user IDs with new users IDs
      let minIDs;
      ({ minIDs, minDoc } = ExpImpMinutes.patchUsers(minDoc, usrMap));

      return db
        .collection("minutes")
        .deleteMany({ _id: { $in: minIDs } }) // delete existing minutes with same IDs
        .then(function (res) {
          if (res.result && !res.result.ok) {
            console.log(res);
          }
          return db
            .collection("minutes")
            .insertMany(minDoc) // insert imported minutes
            .then(function (res) {
              if (res.result.ok === 1 && res.result.n === minDoc.length) {
                console.log(
                  "OK, inserted " + res.result.n + " meeting minutes.",
                );
                resolve({ db, usrMap });
              } else {
                reject("Could not insert meeting minutes");
              }
            });
        });
    });
  }

  static patchUsers(minDoc, usrMap) {
    let minIDs = [];
    for (let m = 0; m < minDoc.length; m++) {
      // iterate all minutes
      minIDs.push(minDoc[m]._id);
      for (
        let i = 0;
        minDoc[m].visibleFor && i < minDoc[m].visibleFor.length;
        i++
      ) {
        minDoc[m].visibleFor[i] = usrMap[minDoc[m].visibleFor[i]];
      }
      for (
        let i = 0;
        minDoc[m].informedUsers && i < minDoc[m].informedUsers.length;
        i++
      ) {
        minDoc[m].informedUsers[i] = usrMap[minDoc[m].informedUsers[i]];
      }
      for (
        let i = 0;
        minDoc[m].participants && i < minDoc[m].participants.length;
        i++
      ) {
        minDoc[m].participants[i].userId =
          usrMap[minDoc[m].participants[i].userId];
      }

      // iterate topics
      for (let t = 0; minDoc[m].topics && t < minDoc[m].topics.length; t++) {
        minDoc[m].topics[t] = ExpImpTopics.patchUsers(
          minDoc[m].topics[t],
          usrMap,
        );
      }
    }

    return { minIDs, minDoc };
  }
}

module.exports = ExpImpMinutes;
