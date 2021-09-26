const ldap = require("ldapjs");
const _ = require("lodash");

const _createLDAPClient = function (settings) {
  return new Promise((resolve, reject) => {
    try {
      const client = ldap.createClient({
        url: settings.serverUrl,
      });

      resolve({
        client,
        settings,
      });
    } catch (error) {
      reject(`Error creating client: ${error}`);
    }
  });
};

const _bind = function (connection) {
  return new Promise((resolve, reject) => {
    const client = connection.client;
    const settings = connection.settings;
    const auth = settings.authentication;
    const userDn = auth && auth.userDn;
    const password = auth && auth.password;

    // no authentication details provided
    // => the ldap server probably allows anonymous access
    if (!userDn || !password) {
      resolve(connection);
      return;
    }

    client.bind(userDn, password, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(connection);
    });
  });
};

const inactivityStrategies = {
  userAccountControl(inactivitySettings, entry) {
    const uac = entry.object.userAccountControl || 0;
    const flagIsSet = uac & 2;

    return Boolean(flagIsSet);
  },
  property(inactivitySettings, entry) {
    const inactiveProperties = inactivitySettings.properties;

    return Object.keys(inactiveProperties).reduce((result, key) => {
      return result || entry.object[key] === inactiveProperties[key];
    }, false);
  },
  none() {
    return false;
  },
};

function isInactive(inactivitySettings, entry) {
  const strategy =
    (inactivitySettings && inactivitySettings.strategy) || "none";
  const strategyFunction =
    inactivityStrategies[strategy] || inactivityStrategies.none;

  return strategyFunction(inactivitySettings, entry);
}

const _fetchLDAPUsers = function (connection) {
  const client = connection.client;
  const settings = connection.settings;
  const base = settings.serverDn;
  const searchDn = _.get(settings, "propertyMap.username", "cn");
  const userLongNameAttribute = _.get(
    settings,
    "propertyMap.longname",
    searchDn
  );
  const emailAttribute = _.get(settings, "propertyMap.email", searchDn);
  const filter = `(&(${searchDn}=*)${settings.searchFilter})`;
  const scope = "sub";
  const whiteListedFields = _.get(settings, "whiteListedFields", []);
  const attributes = whiteListedFields.concat([
    "userAccountControl",
    searchDn,
    userLongNameAttribute,
    emailAttribute,
  ]);
  const options = { filter, scope, attributes, paged: true };

  if (settings.isInactivePredicate && !settings.inactiveUsers) {
    settings.inactiveUsers = {
      strategy: "property",
      properties: settings.isInactivePredicate,
    };
  }

  return new Promise((resolve, reject) => {
    try {
      client.search(base, options, (error, response) => {
        if (error) reject(`Search failed: ${error}`);

        const entries = [];

        response.on("searchEntry", function (entry) {
          const userIsInactive = isInactive(settings.inactiveUsers, entry);
          const userData = Object.assign({}, entry.object, {
            isInactive: userIsInactive,
          });
          entries.push(userData);
        });
        response.on("error", function (error) {
          reject(error);
        });
        response.on("end", function () {
          resolve({ client, settings, entries });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

const _closeLDAPClient = function (connection) {
  const client = connection.client;
  const settings = connection.settings;
  const users = connection.entries;

  return new Promise((resolve) => {
    client.unbind(() => {
      // even if disconnect fails: we still have the users
      // ignore the error and return the users
      resolve({ settings, users });
    });
  });
};

const getLDAPUsers = function (settings) {
  return new Promise((resolve, reject) => {
    _createLDAPClient(settings)
      .then(_bind)
      .then(_fetchLDAPUsers)
      .then(_closeLDAPClient)
      .then(resolve)
      .catch(reject);
  });
};

module.exports = getLDAPUsers;
