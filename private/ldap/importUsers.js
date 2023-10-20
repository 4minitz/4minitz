const loadLDAPSettings = require("../../imports/ldap/loadLDAPSettings");
const importUsers = require("../../imports/ldap/import");
const optionParser = require("node-getopt").create([
  ["s", "settings=[ARG]", "4minitz Meteor settings file"],
  ["m", "mongourl=[ARG]", "Mongo DB url"],
  ["h", "help", "Display this help"],
]);
const arg = optionParser.bindHelp().parseSystem();

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
  console.error("No 4minitz settings file given.");

  process.exit(1);
}

const meteorSettingsFile = arg.options.settings;
const mongoUrl = arg.options.mongourl || process.env.MONGO_URL;

if (!mongoUrl) {
  optionParser.showHelp();
  console.error("No mongo url found in env or given as parameter.");

  process.exit(1);
}

loadLDAPSettings(meteorSettingsFile)
  .then((ldapSettings) => importUsers(ldapSettings, mongoUrl))
  .catch((error) => {
    console.warn(
      `An error occurred while reading the settings file or importing users: ${error}`,
    );
  });
