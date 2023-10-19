const fs = require("fs");
const EJSON = require("bson");
const ExpImpTopics = require("./expImpTopics");

class ExpImpMinutes {
  static get FILENAME_POSTFIX() {
    return "_minutes.json";
  }
  // TODO big function. consider refactoring.
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
              `Saved: ${minFile} with ${allMinutesDoc.length} minutes`,
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
            return;
          }
          return reject(new Error(`Unknown meeting series ID: ${msID}`));
        });
    });
  }
  // TODO big function. consider refactoring.
  static doImport(db, msID, usrMap) {
    return new Promise((resolve, reject) => {
      const minFile = msID + ExpImpMinutes.FILENAME_POSTFIX;
      let minDoc = undefined;
      try {
        minDoc = EJSON.parse(fs.readFileSync(minFile, "utf8"));
        if (!minDoc) {
          return reject(new Error(`Could not read minutes file ${minFile}`));
        }
      } catch (e) {
        return reject(
          new Error(`Could not read minutes file ${minFile}\n${e}`),
        );
      }

      // Replace old user IDs with new users IDs
      let minIDs;
      ({ minIDs, minDoc } = ExpImpMinutes.patchUsers(minDoc, usrMap));

      return db
        .collection("minutes")
        .deleteMany({ _id: { $in: minIDs } }) // delete existing minutes with same IDs
        .then((res) => {
          if (res.result && !res.result.ok) {
            console.log(res);
          }
          return db
            .collection("minutes")
            .insertMany(minDoc) // insert imported minutes
            .then((res) => {
              if (res.result.ok === 1 && res.result.n === minDoc.length) {
                console.log(`OK, inserted ${res.result.n} meeting minutes.`);
                resolve({ db, usrMap });
              } else {
                reject(new Error("Could not insert meeting minutes"));
              }
            });
        });
    });
  }
  // TODO big function. consider refactoring.
  static patchUsers(minDoc, usrMap) {
    const minIDs = [];
    for (const element of minDoc) {
      // iterate all minutes
      minIDs.push(element._id);
      for (
        let i = 0;
        element.visibleFor && i < element.visibleFor.length;
        i++
      ) {
        element.visibleFor[i] = usrMap[element.visibleFor[i]];
      }
      for (
        let i = 0;
        element.informedUsers && i < element.informedUsers.length;
        i++
      ) {
        element.informedUsers[i] = usrMap[element.informedUsers[i]];
      }
      for (
        let i = 0;
        element.participants && i < element.participants.length;
        i++
      ) {
        element.participants[i].userId = usrMap[element.participants[i].userId];
      }

      // iterate topics
      for (let t = 0; element.topics && t < element.topics.length; t++) {
        element.topics[t] = ExpImpTopics.patchUsers(element.topics[t], usrMap);
      }
    }

    return { minIDs, minDoc };
  }
}

module.exports = ExpImpMinutes;
