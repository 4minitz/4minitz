

// Convenience and helper class to manage access rights
// Needs "meteor add alanning:roles"

import { Meteor } from 'meteor/meteor';

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

    static get ROLE_MODERATOR() {
        return "moderator";
    }
    static get ROLE_INVITED() {
        return "invited";
    }


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
}
