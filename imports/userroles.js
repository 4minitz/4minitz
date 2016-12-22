

// Convenience and helper class to manage access rights
// Needs "meteor add alanning:roles"

import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import  './collections/userroles_private';
import { MeetingSeries } from './meetingseries';


export class UserRoles {
    constructor(userId /* may be null */ , userCollection /* may be null */) {
        if (userId) {
            this._userId = userId;
        } else {
            this._userId = Meteor.userId();
        }
        
        let currentUser = null; 
        if (userCollection) {
            currentUser = userCollection.findOne(this._userId);
        } else {
            currentUser = Meteor.users.findOne(this._userId);
        }
        
        if (! currentUser) {
            FlowRouter.go("/");
            throw new Meteor.Error('Could not find user for userId:'+this._userId);
        }

        this._userRoles = currentUser.roles;
        if (! this._userRoles) {
            this._userRoles = [];
        }
        this._user = currentUser;
    }


    // **************************** STATIC METHODS
    static allRolesNumerical() {
        let rolesNum = [];
        for (var key in UserRoles.USERROLES) {
            rolesNum.push(UserRoles.USERROLES[key]);
        }
        return rolesNum;
    }

    static allRolesText() {
        return Object.keys(UserRoles.USERROLES);
    }

    static role2Text(roleValue) {
        for (var key in UserRoles.USERROLES) {
            if (UserRoles.USERROLES[key] == roleValue) {
                return key;
            }
        }
        return undefined;
    }

    static removeAllRolesFor(aMeetingSeriesID) {
        ms = new MeetingSeries(aMeetingSeriesID);
        let affectedUsers = ms.visibleFor;
        if (affectedUsers && affectedUsers.length > 0) {
            Roles.removeUsersFromRoles(affectedUsers, UserRoles.allRolesNumerical(), aMeetingSeriesID);
        }
    }
    
    static isVisibleRole(aRole) {
        return (aRole <= UserRoles.USERROLES.Invited); 
    }

    // **************************** METHODS

    // generate list of visible meeting series for a specific user
    visibleMeetingSeries() {
        let visibleMeetingsSeries = [];
        for (let aMeetingSeriesID in this._userRoles) {
            if (this._userRoles[aMeetingSeriesID] == UserRoles.USERROLES.Moderator ||
                this._userRoles[aMeetingSeriesID]  == UserRoles.USERROLES.Invited) {
                visibleMeetingsSeries.push(aMeetingSeriesID);
            }
        }
        return visibleMeetingsSeries;
    }
    
    isModeratorOf(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] <= UserRoles.USERROLES.Moderator;
    }

    isInvitedTo(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] <= UserRoles.USERROLES.Invited;
    }

    isUploaderFor(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] <= UserRoles.USERROLES.Uploader;
    }


    isInformedAbout(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] <= UserRoles.USERROLES.Informed;
    }
    
    hasViewRoleFor(aMeetingSeriesID) {
        return (this.isInvitedTo(aMeetingSeriesID) /* or lower access role */ );
    }

    currentRoleFor (aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID];
    }

    currentRoleTextFor (aMeetingSeriesID) {
        return UserRoles.role2Text(this._userRoles[aMeetingSeriesID]);
    }

    getUser() {
        return this._user;
    }

    saveRoleForMeetingSeries (aMeetingSeriesID, newRole) {
        Meteor.call("userroles.saveRoleForMeetingSeries", this._userId, aMeetingSeriesID, newRole);
    }

    // remove all roles for the current user for the given meeting series
    removeAllRolesForMeetingSeries(aMeetingSeriesID) {
        Meteor.call("userroles.removeAllRolesForMeetingSeries", this._userId, aMeetingSeriesID);
    }
}

// Security:
// Make sure the values of this enum are string-sortable
// and lower values have higher access rights!
// So, prefix zeroes are important!
UserRoles.USERROLES = {
    "Moderator":   "01"
    , "Uploader":  "05"
    , "Invited":   "10"
    //, "Informed":  "20"   // TODO implement later
};
