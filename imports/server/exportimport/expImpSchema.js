const fs = require('fs');
const EJSON = require('mongodb-extended-json');

const EXPORTER_MADE_FOR_SCHEMA = 19;

class ExpImpSchema {
    static exportCheck (db, msID) {
        return new Promise((resolve, reject) => {
            db.collection('migrations')
                .findOne()
                .then(doc => {
                    if (doc) {
                        console.log("DB Schema Version: "+doc.version);
                        if (EXPORTER_MADE_FOR_SCHEMA !== doc.version) {
                            console.log("*** WARNING *** Schema mismatch!");
                            console.log("                This exporter is made for database schema version: "+EXPORTER_MADE_FOR_SCHEMA);
                            console.log("                But your database has schema version             : "+doc.version);
                            console.log("                Alyways migrate to the most recent DB schema before export!");
                            console.log("                Alyways use matching exporter!");
                            console.log("                Exported data may be corrupt. Continue at your own risk.");
                        }
                        const schemaFile = msID+"_schema.json";
                        fs.writeFileSync(schemaFile, EJSON.stringify(doc,null,2));
                        console.log("Saved: "+schemaFile);
                        resolve(db);
                    } else {
                        reject ("No migrations schema version found in your DB! Unable to export.");
                    }
                });
        });
    };
}

module.exports = ExpImpSchema;
