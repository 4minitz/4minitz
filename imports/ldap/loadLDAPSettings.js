const fs = require("fs");

const _readSettingsFile = (filename) =>
  new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (error, data) => {
      if (error) {
        reject(`Could not read settings file "${filename}"`);
      } else {
        resolve(data);
      }
    });
  });

const _parseJSON = (json) =>
  new Promise((resolve, reject) => {
    try {
      const data = JSON.parse(json);
      resolve(data);
    } catch (error) {
      reject("Could not parse json.");
    }
  });

const _property = (property, object) =>
  new Promise((resolve, reject) => {
    const sub = object[property];
    return sub ? resolve(sub) : reject(`Property "${property}" not found.`);
  });

const loadLDAPSettings = (filename) =>
  new Promise((resolve, reject) => {
    _readSettingsFile(filename)
      .then(_parseJSON)
      .then((settings) => {
        return _property("ldap", settings);
      })
      .then(resolve)
      .catch(reject);
  });

module.exports = loadLDAPSettings;
