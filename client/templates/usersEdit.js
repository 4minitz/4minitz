
import { UserRoles } from '/imports/userroles'

var _config;

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
        // return _config.users;
        return _config.users.find();
    },

    userRoleObj: function (userID) {
        return new UserRoles(userID);
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
        let rolesHTML = '<select id="select111" class="form-control">';
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
        console.log("DelUser? "+JSON.stringify(this));
    },

    "click #btnAddUser": function (evt, tmpl) {
        evt.preventDefault();
        let newUserName = window.prompt("Enter User Name","Wolfram Esser");

        let usr =   {
            "username": newUserName,
            "_idOrg": "vzbpfXdmnikCMTn7g",
            "roles": {
            }
        };

        usr.roles[_config.meetingSeriesID] = ["10"];
        _config.users.insert(usr);
    }
});
