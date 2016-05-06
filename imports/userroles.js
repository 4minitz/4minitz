

// Convenience and helper class to manage access rights
// Needs "meteor add alanning:roles"

import { Meteor } from 'meteor/meteor';

import { MeetingSeries } from './meetingseries'


export class UserRoles {
    constructor(userId) {
        this._userId = userId;
        let currentUser = Meteor.users.findOne(this._userId);
        if (! currentUser) {
            throw new Meteor.Error('Could not find user for userId:'+this._userId);
        }

        this._userRoles = currentUser.roles;
        if (! this._userRoles) {
            throw new Meteor.Error('Could not find roles for userId:'+this._userId);
        }
    }


    // **************************** STATIC METHODS
    static get ROLE_MODERATOR() {
        return "moderator";
    }
    static get ROLE_INVITED() {
        return "invited";
    }

    static allRoles() {
        return [
            UserRoles.ROLE_INVITED,
            UserRoles.ROLE_MODERATOR
        ];
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
            if (this._userRoles[aMeetingSeriesID] == UserRoles.ROLE_MODERATOR ||
                this._userRoles[aMeetingSeriesID]  == UserRoles.ROLE_INVITED) {
                visibleMeetingsSeries.push(aMeetingSeriesID);
            }
        }
        return visibleMeetingsSeries;
    }
    
    isModeratorOf(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] == UserRoles.ROLE_MODERATOR;
    }

    isInvitedTo(aMeetingSeriesID) {
        return this._userRoles[aMeetingSeriesID] == UserRoles.ROLE_INVITED;
    }

}
