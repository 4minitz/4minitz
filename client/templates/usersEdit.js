import { Meteor } from 'meteor/meteor';

import { UserRoles } from '/imports/userroles'

var _config;


// For adding of users:
// build list of available users that are not already shown in user editor
var userlistClean = function (allUsers,substractUsers) {
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
            resultUsers.push(aUser);
        }
    }
    return resultUsers;
};


Template.usersEdit.onCreated(function() {
    _config = this.data;    // UserEditConfig object
});

Template.usersEdit.onRendered(function() {
    $.material.init();
});

Template.usersEdit.onDestroyed(function() {
    //add your statement here
});

Template.usersEdit.helpers({
    isModeEditSeries: function () {
        return _config.mode == "EDIT_SERIES";
    },

    isModeEditMinutes: function () {
        return _config.mode == "EDIT_MINUTES";
    },
    
    users: function () {
        return _config.users.find();
    },

    userRoleObj: function (userID) {
        // get user with roles from temp. user collection, not the global meteor user collection!
        return new UserRoles(userID, _config.users);
    },

    hasViewRole: function () {
        return this.hasViewRoleFor(_config.meetingSeriesID);
    },

    currentRole: function () {
        return this.currentRoleTextFor(_config.meetingSeriesID);
    },

    isModerator: function () {
        return this.isModeratorOf(_config.meetingSeriesID);
    },
    
    rolesOptions: function () {
        let currentRole = this.currentRoleTextFor(_config.meetingSeriesID);
        let rolesHTML = '<select id="select111" class="form-control user-role-select">';
        let rolesText = UserRoles.allRolesText();
        for (let i in rolesText) {
            let role = rolesText[i];
            let startTag = "<option>";
            if (role == currentRole) {
                startTag = '<option selected="selected">'
            }
            rolesHTML += startTag+role+"</option>";
        }
        rolesHTML += '</select>';
        return rolesHTML;
    } 
    
});

Template.usersEdit.events({
    "click #btnDeleteUser": function (evt, tmpl) {
        evt.preventDefault();
        // Attention we need to go via _idOrg here!
        _config.users.remove({_idOrg: this._userId});
    },

    "click #btnAddUser": function (evt, tmpl) {
        evt.preventDefault();
        let possibleUsers = userlistClean(
                                Meteor.users.find().fetch(),
                                _config.users.find().fetch());
        let possibleNames = "";
        for (let i in possibleUsers) {
            possibleNames += "\n    *  '"+possibleUsers[i].username+"'";
        }
        let newUserName = window.prompt("Please enter one of the following available user names:"+possibleNames,"");
        if (!newUserName) {
            return;
        }

        let existingInAllUsers = Meteor.users.findOne({"username": newUserName});
        if (!existingInAllUsers) {
            let msg = "Error: This is not a registered user name: "+newUserName;
            console.log(msg);
            window.alert(msg);
            return;
        }
        let alreadyInEditor = _config.users.findOne({"username": newUserName});
        if (alreadyInEditor) {
            let msg = "Error: user name already in list: "+newUserName;
            console.log(msg);
            window.alert(msg);
            return;
        }

        let usr =   {
            "username": newUserName,
            "_idOrg": existingInAllUsers._id,
            "roles": {
            }
        };

        usr.roles[_config.meetingSeriesID] = [UserRoles.USERROLES.Invited];
        _config.users.insert(usr);
    },

    // when role select changes, update role in temp. client-only user collection
    // ATTENTION: we do NOT keep roles for other meeting series alive here.
    // We only store role for the current edited meeting series
    // its the responsibility of the SAVE routine, to get this straight.
    "change .user-role-select": function (evt, tmpl) {
        var roleString = $(evt.target).val();
        let roleValue = UserRoles.USERROLES[roleString];
        console.log("Select of "+this._user.username+" is now: "+roleString+"=>"+roleValue);
        let newRole = {};
        newRole[_config.meetingSeriesID] = [roleValue];
        _config.users.update(this._userId, {$set: {roles: newRole}});
    }
});
