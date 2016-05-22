
import { UserRoles } from '/imports/userroles'

// For adding of users:
// build list of available users that are not already shown in user editor
export var userlistClean = function (allUsers,substractUsers) {
    let resultUsers = [];

    // build a dict with username => user object
    let indexedSubstractUsers = {};
    for (let i in substractUsers) {
        let sUser = substractUsers[i];
        indexedSubstractUsers[sUser["username"]] = sUser;
    }

    // copy all users to result, if NOT in indexedSubstractUsers
    for (let i in allUsers) {
        let aUser = allUsers[i];
        if (indexedSubstractUsers[aUser["username"]] == undefined) {
            resultUsers.push(aUser["username"]);
        }
    }
    return resultUsers;
};


/**
 * Add a username from the global Meteor.users collection
 * to the temporary client-only user collection.
 *
 * This user will get the role "Invited" for the current meeting series.
 * To enable "Cancel" of editor, this role is kept in the temporary
 * collection until "Save".
 *
 * @param newUserName
 */
export var addNewUser = function (newUserName, config) {
    if (!newUserName) {
        return;
    }

    let addedUser = Meteor.users.findOne({"username": newUserName});
    if (!addedUser) {
        let msg = "Error: This is not a registered user name: "+newUserName;
        console.log(msg);
        window.alert(msg);
        return;
    }
    let alreadyInEditor = config.users.findOne({"username": newUserName});
    if (alreadyInEditor) {
        let msg = "Error: user name already in list: "+newUserName;
        console.log(msg);
        window.alert(msg);
        return;
    }

    // prepare added user for client-side tmp. collection
    addedUser._idOrg = addedUser._id;
    delete addedUser._id;
    if (!addedUser.roles) {
        addedUser.roles = {};
    }

    addedUser.roles[config.meetingSeriesID] = [UserRoles.USERROLES.Invited];
    config.users.insert(addedUser);
};
