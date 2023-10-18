const fs = require("fs");
const EJSON = require("bson");

class ExpImpTopics {
  static get FILENAME_POSTFIX() {
    return "_topics.json";
  }

  static doExport(db, msID, userIDs) {
    return new Promise((resolve, reject) => {
      db.collection("topics")
        .find({ parentId: msID })
        .toArray()
        .then((doc) => {
          if (doc) {
            const topFile = msID + ExpImpTopics.FILENAME_POSTFIX;
            fs.writeFileSync(topFile, EJSON.stringify(doc, null, 2));
            console.log(`Saved: ${topFile} with ${doc.length} topics`);
            resolve({ db, userIDs });
            return;
          }
          return reject(`Unknown meeting series ID: ${msID}`);
        });
    });
  }

  static doImport(db, msID, usrMap) {
    return new Promise((resolve, reject) => {
      const topFile = msID + ExpImpTopics.FILENAME_POSTFIX;
      let AllTopicsDoc = undefined;
      try {
        AllTopicsDoc = EJSON.parse(fs.readFileSync(topFile, "utf8"));
        if (!AllTopicsDoc) {
          return reject(`Could not read topic file ${topFile}`);
        }
      } catch (e) {
        return reject(`Could not read topic file ${topFile}\n${e}`);
      }

      // Replace old user IDs with new users IDs
      const topicIDs = [];
      for (let t = 0; t < AllTopicsDoc.length; t++) {
        topicIDs.push(AllTopicsDoc[t]._id);
        AllTopicsDoc[t] = ExpImpTopics.patchUsers(AllTopicsDoc[t], usrMap);
      }

      return db
        .collection("topics")
        .deleteMany({ _id: { $in: topicIDs } }) // delete existing topics with same IDs
        .then((res) => {
          if (res.result && !res.result.ok) {
            console.log(res);
          }
          return db
            .collection("topics")
            .insertMany(AllTopicsDoc) // insert imported minutes
            .then((res) => {
              if (res.result.ok === 1 && res.result.n === AllTopicsDoc.length) {
                console.log(`OK, inserted ${res.result.n} topics.`);
                resolve({ db, usrMap });
              } else {
                reject("Could not insert topics");
              }
            });
        });
    });
  }

  static patchUsers(topicDoc, usrMap) {
    // patch topic-responsibles
    for (
      let i = 0;
      topicDoc.responsibles && i < topicDoc.responsibles.length;
      i++
    ) {
      if (usrMap[topicDoc.responsibles[i]]) {
        // may be "free text" user
        topicDoc.responsibles[i] = usrMap[topicDoc.responsibles[i]];
      }
    }
    // patch topic-actionitem-responsibles
    for (let i = 0; topicDoc.infoItems && i < topicDoc.infoItems.length; i++) {
      for (
        let j = 0;
        topicDoc.infoItems[i].responsibles &&
        j < topicDoc.infoItems[i].responsibles.length;
        j++
      ) {
        if (usrMap[topicDoc.infoItems[i].responsibles[j]]) {
          // may be "free text" user
          topicDoc.infoItems[i].responsibles[j] =
            usrMap[topicDoc.infoItems[i].responsibles[j]];
        }
      }
    }
    return topicDoc;
  }
}

module.exports = ExpImpTopics;
