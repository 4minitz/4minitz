let optionParser = require('node-getopt').create([
        ['s', 'settings=[ARG]', '4minitz Meteor settings file'],
        ['m', 'mongourl=[ARG]', 'Mongo DB url'],
        ['h', 'help', 'Display this help']
    ]),

    loadLDAPSettings = require('./lib/loadLDAPSettings'),
    getLDAPUsers = require('./lib/getLDAPUsers'),
    saveUsers = require('./lib/saveUsers');


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
    console.error('No mongo url found in env or given as parameter.');

    process.exit(1);
}

let report = function (bulkResult) {
    let inserted = bulkResult.nUpserted,
        updated = bulkResult.nModified;

    console.log(`Successfully inserted ${inserted} users and updated ${updated} users.`);
};

let selfSignedTLSAllowed = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
let importLock = false;
let setSelfSigned = function (ldapSettings) {
    return new Promise((resolve, reject) => {
        if (importLock) {
            reject('There already is a user import running.');
            return;
        }

        importLock = true;

        let allowSelfSignedTLS = ldapSettings.allowSelfSignedTLS;
        selfSignedTLSAllowed = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

        if (allowSelfSignedTLS) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
        }

        resolve(ldapSettings);
    });
};

let resetSelfSigned = function () {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = selfSignedTLSAllowed;
    importLock = false;
};

loadLDAPSettings(meteorSettingsFile)
    .then(setSelfSigned)
    .then(getLDAPUsers)
    .then(data => {
        return saveUsers(data.settings, mongoUrl, data.users);
    })
    .then(report)
    .then(resetSelfSigned)
    .catch(error => {
        // make sure the import lock is released and
        // the NODE_TLS_REJECT_UNAUTHORIZED env is reset
        resetSelfSigned();

        console.warn('An error occurred:');
        console.warn(error);
    });
