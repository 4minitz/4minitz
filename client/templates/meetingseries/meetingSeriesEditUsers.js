import { Meteor } from 'meteor/meteor';

import { addCustomValidator } from '../../helpers/customFieldValidator'

import { UserRoles } from '/imports/userroles'
import { userlistClean, addNewUser, checkUserName } from './meetingSeriesEditUsersHelpers'

var _config;    // of type: UsersEditConfig


export class UsersEditConfig {
    constructor (currentUserReadOnly, meetingSeriesID, users) {
        this.currentUserReadOnly = currentUserReadOnly;
        this.meetingSeriesID = meetingSeriesID;
        this.users = users;
    }
}


Template.meetingSeriesEditUsers.onCreated(function() {
    _config = this.data;    // UsersEditConfig object
});

Template.meetingSeriesEditUsers.onRendered(function() {
    Meteor.typeahead.inject();

    addCustomValidator('#edt_AddUser', (value) => {
        if (value === '') {
            return false;
        }
        return checkUserName(value, _config);
    }, '')
});


Template.meetingSeriesEditUsers.helpers({
    userListClean: function () {
        return userlistClean(
            Meteor.users.find({isInactive: {$not: true}}).fetch(),
            _config.users.find().fetch());
    },
    
    users: function () {
        return _config.users.find({}, {sort: {username: 1}});
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

    // the currently logged in user shall not be able to edit herself.
    // Eg. logged in user shall not change herself Moderator => Invited
    // or currently logged in user shall not be able to delete herself from list
    userIsReadOnly: function () {
        return _config.currentUserReadOnly && (this._user._idOrg === Meteor.userId());
    }, 

    // generate the "<select>" HTML with possible roles and the
    // role selected that is currently attached to the user
    rolesOptions: function () {
        let currentRole = this.currentRoleTextFor(_config.meetingSeriesID);
        let userName = this.getUser().username;
        let rolesHTML = '<select id="roleSelect'+userName+'" class="form-control user-role-select">';
        let rolesText = UserRoles.allRolesText();
        for (let i in rolesText) {
            let role = rolesText[i];
            let startTag = "<option value='"+role+"'>";
            if (role === currentRole) {
                startTag = '<option value="'+role+'" selected="selected">'
            }
            rolesHTML += startTag+role+"</option>";
        }
        rolesHTML += '</select>';
        return rolesHTML;
    },

    displayUsername(userObj) {
        if (userObj.profile && userObj.profile.name) {
            return userObj.profile.name + " ("+ userObj.username+ ")";
        }
        return userObj.username;
    }
});


Template.meetingSeriesEditUsers.events({
    "click #btnDeleteUser": function (evt, tmpl) {
        evt.preventDefault();
        _config.users.remove({_id: this._userId});
    },


    // when role select changes, update role in temp. client-only user collection
    "change .user-role-select": function (evt, tmpl) {
        let roleString = $(evt.target).val();
        let roleValue = UserRoles.USERROLES[roleString];

        let changedUser = _config.users.findOne(this._userId);
        console.log("JSON1: "+JSON.stringify(changedUser,null,2));
        changedUser.roles[_config.meetingSeriesID] = [roleValue];
        _config.users.update(this._userId, {$set: {roles: changedUser.roles}});
        changedUser = _config.users.findOne(this._userId);
        console.log("JSON2: "+JSON.stringify(changedUser,null,2));
    },

    'submit #form-add-user': function(evt, tmpl) {
        evt.preventDefault();
        let newUserName = tmpl.find("#edt_AddUser").value;
        addNewUser(newUserName, _config);

        $('.typeahead')
            .typeahead('val', "")
            .typeahead('close');
    },


    'keyup #edt_AddUser': function(evt, tmpl) {
        if (evt.which === 13) {     // 'ENTER' on username <input>
            evt.stopPropagation();
            evt.preventDefault();

            tmpl.$('#form-add-user').find(':submit').click();

            return false;
        }
        if (evt.which === 27) {     // 'ESC' on username <input>
            evt.stopPropagation();
            evt.preventDefault();
            $('.typeahead')
                .typeahead('val', "")
                .typeahead('close');
            return false;
        }

    },

    // a typeahead suggestion was selected from drop-down menu
    "typeahead:select": function (evt, tmpl, selected) {
        let newUserName = selected.value.toString();
        $('.typeahead').typeahead('val', "");
        addNewUser(newUserName, _config);
    }
});
