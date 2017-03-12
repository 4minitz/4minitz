let ldap = require('ldapjs');

let _createLDAPClient = function (settings) {
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

let _fetchLDAPUsers = function (connection) {
    let client = connection.client,
        settings = connection.settings,
        base = settings.serverDn,
        filter = `(&(${settings.searchDn}=*)${settings.searchFilter})`,
        scope = 'sub',
        attributes = settings.whiteListedFields,
        isIncativePred = settings.isInactivePredicate,
        options = {filter, scope, attributes};

    return new Promise((resolve, reject) => {
        try {
            client.search(base, options, (error, response) => {
                if (error) reject(`Search failed: ${error}`);

                let entries = [];

                response.on('searchEntry', function (entry) {
                    let isIncative = false;
                    if(isIncativePred) {    // check if at least one inactive predicate matches
                        Object.keys(isIncativePred).forEach(key => {
                            if (entry.object[key] === isIncativePred[key]) {
                                isIncative = true;  // user should not be able to log in
                            }
                        });
                    }
                    entries.push(entry.object);
                    if (isIncative) {
                        entries[entries.length-1]["isInactive"] = true;
                    }
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

let _closeLDAPClient = function (connection) {
    let client = connection.client,
        settings = connection.settings,
        users = connection.entries;

    return new Promise((resolve) => {
        client.unbind(() => {
            // even if disconnect fails: we still have the users
            // ignore the error and return the users
            resolve({settings, users});
        });
    });
};

let getLDAPUsers = function (settings) {
    return new Promise((resolve, reject) => {
        _createLDAPClient(settings)
            .then(_fetchLDAPUsers)
            .then(_closeLDAPClient)
            .then(resolve)
            .catch(reject);
    });
};

module.exports = getLDAPUsers;