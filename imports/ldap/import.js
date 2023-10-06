let getLDAPUsers = require("./getLDAPUsers"),
  saveUsers = require("./saveUsers");

let report = function (bulkResult) {
  let inserted = bulkResult.nUpserted,
    updated = bulkResult.nModified;

  console.log(
    `Successfully inserted ${inserted} users and updated ${updated} users.`,
  );
};

let selfSignedTLSAllowed = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
let importLock = false;
let setSelfSigned = function (ldapSettings) {
  return new Promise((resolve, reject) => {
    if (importLock) {
      reject("There already is a user import running.");
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

let handleRejection = function (error) {
  // make sure the import lock is released and
  // the NODE_TLS_REJECT_UNAUTHORIZED env is reset
  resetSelfSigned();
  console.warn(`An error occurred: ${error}`);
  console.warn(`Error: ${JSON.stringify(error, null, 2)}`);
  throw error;
};

let importUsers = function (ldapSettings, mongoUrl) {
  return setSelfSigned(ldapSettings)
    .then(getLDAPUsers)
    .then((data) => {
      return saveUsers(data.settings, mongoUrl, data.users);
    })
    .then(report)
    .then(resetSelfSigned)
    .catch(handleRejection);
};

module.exports = importUsers;
