const fs = require('fs');
const EJSON = require('bson');

class ExpImpSchema {
    static get MADE_FOR_SCHEMA() {
        return 21;
    }

    static get FILENAME_POSTFIX() {
        return '_schema.json';
    }

    static exportCheck (db, msID) {
        return new Promise((resolve, reject) => {
            db.collection('migrations')
                .findOne()
                .then(doc => {
                    if (doc) {
                        console.log('DB Schema Version: '+doc.version);
                        if (ExpImpSchema.MADE_FOR_SCHEMA !== doc.version) {
                            console.log('*** WARNING *** Schema mismatch!');
                            console.log('                This exporter is made for database schema version: '+ExpImpSchema.MADE_FOR_SCHEMA);
                            console.log('                But your database has schema version             : '+doc.version);
                            console.log('                Alyways migrate to the most recent DB schema before export!');
                            console.log('                Alyways use matching exporter!');
                            console.log('                Exported data may be corrupt. Continue at your own risk.');
                        }
                        const schemaFile = msID + ExpImpSchema.FILENAME_POSTFIX;
                        fs.writeFileSync(schemaFile, EJSON.stringify(doc,null,2));
                        console.log('Saved: '+schemaFile);
                        resolve(db);
                    } else {
                        return reject ('No migrations schema version found in your DB! Unable to export.');
                    }
                });
        });
    }

    static preImportCheck (db, msID, force=false) {
        return new Promise((resolve, reject) => {
            db.collection('migrations')
                .findOne()
                .then(doc => {
                    if (doc) {
                        console.log('DB Schema Version: '+doc.version);

                        const schemaFile = msID + ExpImpSchema.FILENAME_POSTFIX;
                        let exportedSchema = undefined;
                        try {
                            exportedSchema = EJSON.parse(fs.readFileSync(schemaFile, 'utf8'));
                            if (!exportedSchema) {
                                return reject('Could not read schema file '+schemaFile);
                            }
                        } catch (e) {
                            return reject('Could not read schema file '+schemaFile);
                        }

                        if (ExpImpSchema.MADE_FOR_SCHEMA !== doc.version
                            || ExpImpSchema.MADE_FOR_SCHEMA !== exportedSchema.version
                            || doc.version !== exportedSchema.version) {
                            console.log('*** WARNING *** Schema mismatch!');
                            console.log('                This importer is made for database schema version: '+ExpImpSchema.MADE_FOR_SCHEMA);
                            console.log('                Your database has schema version                 : '+doc.version);
                            console.log('                Your exported data has schema version            : '+exportedSchema.version);
                            console.log('                Alyways migrate to the most recent DB schema before export/import!');
                            console.log('                Alyways use matching exporter!');
                            if (force) {
                                console.log('                --force switch detected. Continueing...');
                            } else {
                                console.log('                Import will stop.');
                                console.log('                Use --force switch to enforce import at your own risk.');
                                return reject('Schema mismatch');
                            }
                        }
                        resolve(db);
                    } else {
                        return reject ('No migrations schema version found in your DB! Unable to import.');
                    }
                });
        });
    }
}

module.exports = ExpImpSchema;
