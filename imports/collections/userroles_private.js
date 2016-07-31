
import { Meteor } from 'meteor/meteor';

import { GlobalSettings } from '/imports/GlobalSettings'
import { UserRoles } from "./../userroles"

if (Meteor.isServer) {
    // Security: intentionally suppress email addresses of all other users!
    let publishFields = {'username': 1, 'roles': 1};
    // Security: only publish email address in trusted intranet environment
    if(GlobalSettings.isTrustedIntranetInstallation()) {
        publishFields.emails = 1;
    }
    Meteor.publish('userListSimple', function () {
        return Meteor.users.find(
            {},
            {fields: publishFields});
    });
}

if (Meteor.isClient) {
    // This gets visible via Meteor.users collection
    Meteor.subscribe('userListSimple');
}


Meteor.methods({
    'userroles.saveRoleForMeetingSeries'(otherUserId, meetingSeriesId, newRole) {
        if (Meteor.userId() == otherUserId) {
            return; // silently swallow: user may never change own role!
        }
        
        // Security: Ensure user is moderator of affected meeting series
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(meetingSeriesId)) {
            Roles.removeUsersFromRoles(otherUserId, UserRoles.allRolesNumerical(), meetingSeriesId);
            Roles.addUsersToRoles(otherUserId, newRole, meetingSeriesId);
        } else {
            throw new Meteor.Error("Cannot set roles for meeting series", "You are not moderator of this meeting series.");
        }
        
        
    }
});
