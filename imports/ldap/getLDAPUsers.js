const ldap = require("ldapjs"),
  _ = require("lodash");

let _createLDAPClient = function (settings) {
  return new Promise((resolve, reject) => {
    try {
      let client = ldap.createClient({
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

let _bind = function (connection) {
  return new Promise((resolve, reject) => {
    const client = connection.client,
      settings = connection.settings,
      auth = settings.authentication,
      userDn = auth?.userDn,
      password = auth?.password;

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
    const uac = entry.object.userAccountControl || 0,
      flagIsSet = uac & 2;

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
  const strategy = inactivitySettings?.strategy || "none",
    strategyFunction =
      inactivityStrategies[strategy] || inactivityStrategies.none;

  return strategyFunction(inactivitySettings, entry);
}

let _fetchLDAPUsers = function (connection) {
  let client = connection.client,
    settings = connection.settings,
    base = settings.serverDn,
    searchDn = _.get(settings, "propertyMap.username", "cn"),
    userLongNameAttribute = _.get(settings, "propertyMap.longname", searchDn),
    emailAttribute = _.get(settings, "propertyMap.email", searchDn),
    filter = `(&(${searchDn}=*)${settings.searchFilter})`,
    scope = "sub",
    whiteListedFields = _.get(settings, "whiteListedFields", []),
    attributes = whiteListedFields.concat([
      "userAccountControl",
      searchDn,
      userLongNameAttribute,
      emailAttribute,
    ]),
    options = { filter, scope, attributes, paged: true };

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

        let entries = [];

        response.on("searchEntry", function (entry) {
          const userIsInactive = isInactive(settings.inactiveUsers, entry),
            userData = Object.assign({}, entry.object, {
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

let _closeLDAPClient = function (connection) {
  let client = connection.client,
    settings = connection.settings,
    users = connection.entries;

  return new Promise((resolve) => {
    client.unbind(() => {
      // even if disconnect fails: we still have the users
      // ignore the error and return the users
      resolve({ settings, users });
    });
  });
};

let getLDAPUsers = function (settings) {
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
