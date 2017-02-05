
import { Meteor } from 'meteor/meteor';

import { GlobalSettings } from '/imports/GlobalSettings'
import { UserRoles } from "./../userroles"

if (Meteor.isServer) {
    // #Security: first reset all admins, then set "isAdmin:true" for IDs in settings.json
    Meteor.users.update({isAdmin: true},
        {$unset: { isAdmin: false }}, {multi: true});
    if (Meteor.settings.adminIDs && Array.isArray(Meteor.settings.adminIDs) && Meteor.settings.adminIDs.length > 0) {
        // set admins
        Meteor.users.update({_id: {$in: Meteor.settings.adminIDs}},
            {$set: { isAdmin: true }},{multi: true});

        console.log("*** Admin IDs:");
        Meteor.settings.adminIDs.forEach(id => {
            let user = Meteor.users.findOne(id);
            if (user) {
                console.log("    "+user._id+": "+user.username);
            } else {
                console.log("    "+id+": unknown ID!");
            }
        });
    }

    // #Security: intentionally suppress email addresses of all other users!
    let publishFields = {'username': 1, 'roles': 1};
    // #Security: only publish email address in trusted intranet environment
    if(GlobalSettings.isTrustedIntranetInstallation()) {
        publishFields["emails"] = 1;
        publishFields["profile.name"] = 1;
    }
    Meteor.publish('userListSimple', function () {
        if(this.userId) {
            return Meteor.users.find(
                {},
                {fields: publishFields});
        }
    });

    // #Security: Publish some fields only for the logged in user
    Meteor.publish('userSettings', function () {
        if(this.userId) {
            return Meteor.users.find(
                {_id: this.userId},
                {fields: {'settings': 1,
                          'isAdmin': 1}});
        }
    });

    // #Security: Publish all user fields only to admin user
    Meteor.publish('userAdmin', function () {
        if(this.userId) {
            let usr = Meteor.users.findOne(this.userId);
            if (usr.isAdmin) {
                return Meteor.users.find({});
            }
        }
    });
}

if (Meteor.isClient) {
    // This gets visible via Meteor.users collection
    Meteor.subscribe('userListSimple');
    Meteor.subscribe('userSettings');
    Meteor.subscribe('userAdmin');
}


Meteor.methods({
    'userroles.saveRoleForMeetingSeries'(otherUserId, meetingSeriesId, newRole) {
        if (Meteor.isServer) {console.log("Method: userroles.saveRoleForMeetingSeries ", otherUserId, meetingSeriesId, newRole);}
        if (! Meteor.userId()) {
            throw new Meteor.Error("Not logged in.");
        }
        if (Meteor.userId() == otherUserId) {
            return; // silently swallow: user may never change own role!
        }
        
        // #Security: Ensure user is moderator of affected meeting series
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(meetingSeriesId)) {
            Roles.removeUsersFromRoles(otherUserId, UserRoles.allRolesNumerical(), meetingSeriesId);
            Roles.addUsersToRoles(otherUserId, newRole, meetingSeriesId);
        } else {
            throw new Meteor.Error("Cannot set roles for meeting series", "You are not moderator of this meeting series.");
        }
    },

    'userroles.removeAllRolesForMeetingSeries' (otherUserId, meetingSeriesId) {
        if (Meteor.isServer) {console.log("Method: userroles.removeAllRolesForMeetingSeries ", otherUserId, meetingSeriesId);}
        if (! Meteor.userId()) {
            throw new Meteor.Error("Not logged in.");
        }
        if (Meteor.userId() == otherUserId) {
            return; // silently swallow: user may never change own role!
        }

        // #Security: Ensure user is moderator of affected meeting series
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(meetingSeriesId)) {
            Roles.removeUsersFromRoles(otherUserId, UserRoles.allRolesNumerical(), meetingSeriesId);
        } else {
            throw new Meteor.Error("Cannot set roles for meeting series", "You are not moderator of this meeting series.");
        }
    }
});
