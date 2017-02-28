let fs = require('fs');

let _readSettingsFile = function (filename) {
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

let _parseJSON = function (json) {
    return new Promise((resolve, reject) => {
        try {
            let data = JSON.parse(json);
            resolve(data);
        } catch (error) {
            reject('Could not parse json.');
        }
    });
};

let _property = function (property, object) {
    return new Promise((resolve, reject) => {
        let sub = object[property];
        return sub ? resolve(sub) : reject(`Property "${property}" not found.`);
    });
};


let loadLDAPSettings = function (filename) {
    return new Promise((resolve, reject) => {
        _readSettingsFile(filename)
            .then(_parseJSON)
            .then(settings => {
                return _property('ldap', settings)
            })
            .then(resolve)
            .catch(reject);
    });
};

module.exports = loadLDAPSettings;