

// Convenience and helper class to manage access rights
// Needs "meteor add alanning:roles"

import { Meteor } from 'meteor/meteor';

export class UserRoles {
    constructor(userId) {
        this._userId = userId;
    }

    static get ROLE_MODERATOR() {
        return "moderator";
    }
    static get ROLE_INVITED() {
        return "invited";
    }


    // generate list of visible meeting series for a specific user
    visibleMeetingSeries() {
        let currentUser = Meteor.users.findOne(this._userId);
        if (! currentUser) {
            return [];
        }

        let visibleMeetingsSeries = [];
        for (let aMeetingSeriesID in currentUser.roles) {
            if (currentUser.roles[aMeetingSeriesID] == UserRoles.ROLE_MODERATOR ||
                currentUser.roles[aMeetingSeriesID]  == UserRoles.ROLE_INVITED) {
                visibleMeetingsSeries.push(aMeetingSeriesID);
            }
        }
        return visibleMeetingsSeries;
    }
}
