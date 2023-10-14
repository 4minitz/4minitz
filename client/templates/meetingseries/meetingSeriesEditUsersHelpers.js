import { UserRoles } from "/imports/userroles";
import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";

const longName2shortName = {};

// For adding of users:
// build list of available users that are not already shown in user editor
export const userlistClean = (allUsers, substractUsers) => {
  const resultUsers = [];

  // build a dict with username => user object
  const indexedSubstractUsers = {};
  for (const i in substractUsers) {
    const sUser = substractUsers[i];
    indexedSubstractUsers[sUser.username] = sUser;
  }

  // copy all users to result, if NOT in indexedSubstractUsers
  for (const i in allUsers) {
    const aUser = allUsers[i];
    if (indexedSubstractUsers[aUser.username] === undefined) {
      const longname =
        aUser.profile?.name && aUser.profile.name !== ""
          ? ` - ${aUser.profile.name}`
          : "";
      resultUsers.push(aUser.username + longname);
      // create lookup dict to convert the long LDAP names back to unique short
      // usernames
      longName2shortName[aUser.username + longname] = aUser.username;
    }
  }

  return resultUsers;
};

export function checkUserName(newUserName, config) {
  // convert the LDAP long name back to the short unique username
  newUserName = longName2shortName[newUserName];
  const addedUser = Meteor.users.findOne({ username: newUserName });
  const result = {
    addedUser,
    valid: false,
    errorMsg: "",
  };
  if (!addedUser) {
    result.errorMsg = i18n.__("MeetingSeries.Edit.Error.notRegistered");
    return result;
  }
  const alreadyInEditor = config.users.findOne({ username: newUserName });
  if (alreadyInEditor) {
    result.errorMsg = i18n.__("MeetingSeries.Edit.Error.alreadyInList");
    return result;
  }

  result.valid = true;
  return result;
}

/**
 * Add a username from the global Meteor.users collection
 * to the temporary client-only user collection.
 *
 * This user will get the role "Invited" for the current meeting series.
 * To enable "Cancel" of editor, this role is kept in the temporary
 * collection until "Save".
 */
export const addNewUser = (newUserName, config) => {
  if (!newUserName) {
    return;
  }

  const checkResult = checkUserName(newUserName, config);
  if (!checkResult.valid) {
    console.log(checkResult.errorMsg);
    window.alert(checkResult.errorMsg);
  }
  const addedUser = checkResult.addedUser;

  // prepare added user for client-side tmp. collection
  addedUser._idOrg = addedUser._id;
  delete addedUser._id;
  if (!addedUser.roles) {
    addedUser.roles = {};
  }

  addedUser.roles[config.meetingSeriesID] = [UserRoles.USERROLES.Invited];
  config.users.insert(addedUser);
};
