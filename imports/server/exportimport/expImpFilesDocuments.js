const fs = require("fs");
const EJSON = require("bson");

class ExpImpFilesDocuments {
  static get FILENAME_POSTFIX() {
    return "_filesDocuments.json";
  }

  static doExport(db, msID, userIDs) {
    return new Promise((resolve, reject) => {
      db.collection("DocumentsCollection")
        .find({ "meta.meetingSeriesId": msID })
        .toArray()
        .then((doc) => {
          if (doc) {
            const protFile = msID + ExpImpFilesDocuments.FILENAME_POSTFIX;
            fs.writeFileSync(protFile, EJSON.stringify(doc, null, 2));
            console.log(
              `Saved: ${protFile} with ${doc.length} protocol documents`,
            );
            if (doc[0]) {
              console.log(
                "      *** Hint *** Please manually copy all files below:",
              );
              console.log(
                `      ${doc[0]._storagePath.substr(
                  0,
                  doc[0]._storagePath.lastIndexOf("/"),
                )}`,
              );
            }
            resolve({ db, userIDs });
            return;
          }
          return reject(`Unknown meeting series ID: ${msID}`);
        });
    });
  }

  static doImport(db, msID, usrMap) {
    return new Promise((resolve, reject) => {
      const protFile = msID + ExpImpFilesDocuments.FILENAME_POSTFIX;
      let AllProtocolsDoc = undefined;
      try {
        AllProtocolsDoc = EJSON.parse(fs.readFileSync(protFile, "utf8"));
        if (!AllProtocolsDoc) {
          return reject(`Could not read documents file ${protFile}`);
        }
      } catch (e) {
        return reject(`Could not read documents file ${protFile}\n${e}`);
      }

      // Replace old user IDs with new users IDs
      const protcolsIDs = [];
      for (let p = 0; p < AllProtocolsDoc.length; p++) {
        protcolsIDs.push(AllProtocolsDoc[p]._id);
        AllProtocolsDoc[p] = ExpImpFilesDocuments.patchUsers(
          AllProtocolsDoc[p],
          usrMap,
        );
      }

      return db
        .collection("DocumentsCollection")
        .deleteMany({
          _id: { $in: protcolsIDs },
        }) // delete existing attachments with same IDs
        .then((res) => {
          if (res.result && !res.result.ok) {
            console.log(res);
          }
          return db
            .collection("DocumentsCollection")
            .insertMany(AllProtocolsDoc) // insert imported minutes
            .then((res) => {
              if (
                res.result.ok === 1 &&
                res.result.n === AllProtocolsDoc.length
              ) {
                console.log(
                  `OK, inserted ${res.result.n} protocol files meta data.`,
                );
                resolve({ db, usrMap });
              } else {
                reject("Could not insert protocol files meta data");
              }
            });
        });
    });
  }

  static patchUsers(protocolDoc, usrMap) {
    if (usrMap[protocolDoc.userId]) {
      protocolDoc.userId = usrMap[protocolDoc.userId];
    }
    return protocolDoc;
  }
}

module.exports = ExpImpFilesDocuments;
