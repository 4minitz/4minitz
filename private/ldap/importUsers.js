let ldap = require('ldapjs'),
    mongo = require('mongodb').MongoClient,
    random = require('randomstring'),
    fs = require('fs'),
    _ = require('underscore'),
    optionParser = require('node-getopt').create([
        ['s', 'settings=[ARG]', '4minitz Meteor settings file'],
        ['m', 'mongourl=[ARG]', 'Mongo DB url'],
        ['h', 'help', 'Display this help']
    ]);

let arg = optionParser.bindHelp().parseSystem();

// check preconditions
// we need a meteor settings file for the ldap settings and we
// need a mongo url
//
// the meteor settings file has to be provided via command line parameters
//
// for the mongo url, first check environment variables, then
// parameters and if neither provides a url, exit with an error

if (!arg.options.settings) {
    optionParser.showHelp();
    console.error('No 4minitz settings file given.');

    process.exit(1);
}

let meteorSettingsFile = arg.options.settings;

let mongoUrl = arg.options.mongourl || process.env.MONGO_URL;

if (!mongoUrl) {
    optionParser.showHelp();
    console.error('No mongo url found in env or given as parameter.')

    process.exit(1);
}

// Load ldap settings

let readSettingsFile = function (filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (error, data) => {
            if (error) {
                reject(`Could not read settings file "${filename}"`);
            } else {
                resolve(data);
            }
        });
    });
};

let parseJSON = function (json) {
    return new Promise((resolve, reject) => {
        try {
            let data = JSON.parse(json);
            resolve(data);
        } catch (error) {
            reject('Could not parse json.');
        }
    });
};

let safeProp = function (property, object) {
    return new Promise((resolve, reject) => {
        let sub = object[property];
        return sub ? resolve(sub) : reject(`Property "${property}" not found.`);
    });
};


let loadLDAPSettings = function (filename) {
    return new Promise((resolve, reject) => {
        readSettingsFile(filename)
            .then(parseJSON)
            .then(settings => {
                return safeProp('ldap', settings)
            })
            .then(resolve)
            .catch(reject);
    });
};


// get users from ldap

let createLDAPClient = function (settings) {
    // An IO monad would be better suited but this will be surrounded
    // by other tasks so using Task makes chaining easier

    return new Promise((resolve, reject) => {
        try {
            let client = ldap.createClient({
                url: settings.serverUrl
            });

            resolve({
                client,
                settings
            });
        } catch (error) {
            reject(`Error creating client: ${error}`);
        }
    });
};

let fetchLDAPUsers = function (connection) {
    let client = connection.client,
        settings = connection.settings,
        base = settings.serverDn,
        filter = `(&(${settings.searchDn}=*)${settings.searchFilter})`,
        scope = 'sub',
        attributes = settings.whiteListedFields,
        options = {filter, scope, attributes};

    return new Promise((resolve, reject) => {
        try {
            client.search(base, options, (error, response) => {
                if (error) reject(`Search failed: ${error}`);

                let entries = [];

                response.on('searchEntry', function (entry) {
                    entries.push(entry.object);
                });
                response.on('error', function (error) {
                    reject(error);
                });
                response.on('end', function () {
                    resolve({client, settings, entries});
                });
            });
        } catch (error) {
            reject(error);
        }
    });
};

let closeLDAPClient = function (connection) {
    let client = connection.client,
        settings = connection.settings,
        users = connection.entries;

    return new Promise((resolve, reject) => {
        client.unbind(error => {
            if (error) {
                reject(error);
            } else {
                resolve({settings, users});
            }
        });
    });
};

let getLDAPUsers = function (settings) {
    return new Promise((resolve, reject) => {
        createLDAPClient(settings)
            .then(fetchLDAPUsers)
            .then(closeLDAPClient)
            .then(resolve)
            .catch(reject);
    });
};

// transform and add users to mongodb

let createUser = function (ldapSettings, userData) {
    let searchDn = ldapSettings.searchDn || 'cn';

    return {
        createdAt: new Date(),
        emails: [userData.mail],
        username: userData[searchDn],
        profile: _.pick(userData, _.without(ldapSettings.whiteListedFields, 'mail'))
    };
};

let transformUsers = function (settings, users) {
    return _.map(users, user => createUser(settings, user));
};

let connectMongo = function (mongoUrl) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongoUrl, (error, db) => {
            if (error) {
                reject(error);
            }

            resolve(db);
        });
    });
};

let insertUsers = function (db, users) {
    // unique id from the random package also used by minimongo
    // character list: https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L88
    // string length: https://github.com/meteor/meteor/blob/release/METEOR%401.4.0.1/packages/random/random.js#L197
    const randomStringConfig = {
        length: 17,
        charset: '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz'
    };

    return new Promise((resolve, reject) => {
        try {
            let bulk = db.collection('users').initializeUnorderedBulkOp();
            _.each(users, user => {
                bulk.find({username: user.username}).upsert().updateOne({
                    $setOnInsert: {
                        _id: random.generate(randomStringConfig),
                        // by setting this only on insert we won't log out everyone
                        // everytime we sync the users
                        services: {
                            password: {bcrypt: ""},
                            resume: {"loginTokens": []}
                        }
                    },
                    $set: user
                });
            });
            let bulkResult = bulk.execute();

            resolve({db, bulkResult});
        } catch (error) {
            reject(error);
        }
    });
};

let closeMongo = function (data) {
    let force = true,
        db = data.db,
        result = data.bulkResult;

    return new Promise((resolve) => {
        db.close(force);
        resolve(result);
    });
};


let importUsers = function (settings, mongoUrl, users) {
    let dbUsers = transformUsers(settings, users);

    return new Promise((resolve, reject) => {
        connectMongo(mongoUrl)
            .then(db => {
                return insertUsers(db, dbUsers);
            })
            .then(closeMongo)
            .then(resolve)
            .catch(reject);
    });
};


// connect everything

let report = function (bulkResult) {
    let inserted = bulkResult.nInserted,
        updated = bulkResult.nModified;

    console.log(`Successfully inserted ${inserted} users and updated ${updated} users.`);
};

loadLDAPSettings(meteorSettingsFile)
    .then(getLDAPUsers)
    .then(data => {
        return importUsers(data.settings, mongoUrl, data.users);
    })
    .then(report)
    .catch(error => {
        console.warn('An error occurred:');
        console.warn(error);
    });
