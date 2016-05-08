

// Convenience and helper class to manage access rights
// Needs "meteor add alanning:roles"

import { Meteor } from 'meteor/meteor';

import  './collections/userroles_private';
import { MeetingSeries } from './meetingseries'


// Security:
// Make sure the values of this enum are string-sortable
// and lower values have higher access rights!
// So, prefix zeroes are important!
export var USERROLES = {
        "Moderator":   "01"
        , "Invited":   "10"
        //, "Informed":  "20"   // TODO implement later
};

export class UserRoles {
    constructor(userId) {
        this._userId = userId;
        let currentUser = Meteor.users.findOne(this._userId);
        if (! currentUser) {
            Router.go("/");
            throw new Meteor.Error('Could not find user for userId:'+this._userId);
        }

        this._userRoles = currentUser.roles;
        this._user = currentUser;
        
        if (! this._userRoles) {
            Router.go("/");
            throw new Meteor.Error('Could not find roles for userId:'+this._userId);
        }
    }


    // **************************** STATIC METHODS
    static allRolesNumerical() {
        let rolesNum = [];
        for (var key in USERROLES) {
            rolesNum.push(USERROLES[key]);
        }
        return rolesNum;
    }

    static allRolesText() {
        return Object.keys(USERROLES);
    }

    static role2Text(roleValue) {
        for (var key in USERROLES) {
            if (USERROLES[key] == roleValue) {
                return key;
            }
        }
        return undefined;
    }

    static removeAllRolesFor(aMeetingSeriesID) {
        ms = new MeetingSeries(aMeetingSeriesID);
        let affectedUsers = ms.visibleFor;
        if (affectedUsers && affectedUsers.length > 0) {
            Roles.removeUsersFromRoles(affectedUsers, UserRoles.allRoles(), aMeetingSeriesID);
        }
    }


    // **************************** METHODS

    // generate list of visible meeting series for a specific user
    visibleMeetingSeries() {
        let visibleMeetingsSeries = [];
        for (let aMeetingSeriesID in this._userRoles) {
            if (this._userRoles[aMeetingSeriesID] == USERROLES.Moderator ||
                this._userRoles[aMeetingSeriesID]  == USERROLES.Invited) {
                visibleMeetingsSeries.push(aMeetingSeriesID);
            }
        }
        return visibleMeetingsSeries;
    }
    
    isModeratorOf(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] == USERROLES.Moderator;
    }

    isInvitedTo(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] == USERROLES.Invited;
    }

    isInformedAbout(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] == USERROLES.Informed;
    }

    hasViewRoleFor(aMeetingSeriesID) {
        return (this.isInvitedTo(aMeetingSeriesID) || 
                this.isModeratorOf(aMeetingSeriesID));
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
}
