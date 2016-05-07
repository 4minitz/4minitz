
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
        return _config.users;
    },

    userRoleObj: function (userID) {
        return new UserRoles(userID);
    },

    isVisibleForUser: function () {
        return this.hasViewRoleFor(_config.meetingSeriesID);
    },

    isModerator: function () {
        return this.isModeratorOf(_config.meetingSeriesID);
    }

});

Template.usersEdit.events({
    "click #btnDeleteUser": function (evt, tmpl) {
        evt.preventDefault();

        console.log("DelUser? "+JSON.stringify(this));
    }
});
