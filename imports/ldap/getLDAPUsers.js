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

const inactivityStrategies = {
    userAccountControl(inactivitySettings, entry) {
        const uac = entry.object.userAccountControl,
            flagIsSet = uac & 2;
        
        return !!flagIsSet;
    },
    property(inactivitySettings, entry) {
        const inactiveProperties = inactivitySettings.properties;

        return Object.keys(inactiveProperties).reduce((result, key) => {
            return result || (entry.object[key] === inactiveProperties[key]);
        }, false);
    },
    none() {
        return false;
    }
}

function isInactive(inactivitySettings, entry) {
    const strategy = inactivitySettings.strategy;

    return inactivityStrategies[strategy](inactivitySettings, entry);
}

let _fetchLDAPUsers = function (connection) {
    let client = connection.client,
        settings = connection.settings,
        base = settings.serverDn,
        searchDn = settings.propertyMap.username,
        filter = `(&(${searchDn}=*)${settings.searchFilter})`,
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
                    const userIsInactive = isInactive(settings.inactiveUsers, entry),
                        userData = Object.assign({}, entry.object, {isInactive: userIsInactive});
                    entries.push(userData);
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