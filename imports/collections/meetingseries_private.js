import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { MeetingSeries } from './../meetingseries';
import { Minutes } from './../minutes';
import { MeetingSeriesSchema } from './meetingseries.schema';
import { UserRoles } from "./../userroles";

export var MeetingSeriesCollection = new Mongo.Collection("meetingSeries",
    {
        // inject methods of class MeetingSeries to all returned collection docs
        transform: function (doc) {
            return new MeetingSeries(doc);
        }
    }
);

if (Meteor.isServer) {
    Meteor.publish('meetingSeries', function meetingSeriesPublication() {
        return MeetingSeriesCollection.find(
            {visibleFor: {$in: [this.userId]}});
    });
}
if (Meteor.isClient) {
    Meteor.subscribe('meetingSeries');
}

MeetingSeriesCollection.attachSchema(MeetingSeriesSchema);

Meteor.methods({
    'meetingseries.insert'(doc, optimisticUICallback) {
        console.log("meetingseries.insert");

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // the user should not be able to define the date when this series was create - or should he?
        // -> so we overwrite this field if it was set previously
        let currentDate = new Date();
        doc.createdAt = currentDate;
        doc.lastMinutesDate = formatDateISO8601(currentDate);

        // limit visibility of this meeting series (see server side publish)
        // array will be expanded by future invites
        doc.visibleFor = [Meteor.userId()];

        // Every logged in user is allowed to create a new meeting series.
        MeetingSeriesCollection.insert(doc, function(error, newMeetingSeriesID) {
            if (error) {
                throw error;
            }

            if (Meteor.isClient && optimisticUICallback) {
                optimisticUICallback(newMeetingSeriesID);
            }

            doc._id = newMeetingSeriesID;
            // Make creator of this meeting series the first moderator
            Roles.addUsersToRoles(Meteor.userId(), UserRoles.USERROLES.Moderator, newMeetingSeriesID);
        });
    },

    'meetingseries.update'(doc) {
        if (!doc) {
            console.log('meetingseries.update: no data given');
            return;
        }

        console.log("meetingseries.update:", doc.minutes);

        let id = doc._id;
        delete doc._id; // otherwise collection.update will fail
        if (!id) {
            return;
        }

        // TODO: fix security issue: it is not allowed to modify (e.g. remove) elements from the minutes array!

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(id)) {
            MeetingSeriesCollection.update(id, {$set: doc});
        } else {
            throw new Meteor.Error("Cannot update meeting series", "You are not moderator of this meeting series.");
        }
    },

    'meetingseries.remove'(id) {
        console.log("meetingseries.remove:"+id);
        if (id == undefined || id == "")
            return;

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(id)) {
            UserRoles.removeAllRolesFor(id);
            MeetingSeriesCollection.remove(id);
        } else {
            throw new Meteor.Error("Cannot remove meeting series", "You are not moderator of this meeting series.");
        }
    },

    'meetingseries.removeMinutesFromArray'(meetingSeriesId, minutesId) {
        console.log("meetingseries.removeMinutesFromArray: MeetingSeries ("
            + meetingSeriesId + "), Minutes (" + minutesId + ")");

        // Minutes can only be removed as long as they are not finalized
        let aMin = new Minutes(minutesId);
        if (aMin.isFinalized) return;

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (userRoles.isModeratorOf(meetingSeriesId)) {
            MeetingSeriesCollection.update(meetingSeriesId, {$pull: {'minutes': minutesId}});
        } else {
            throw new Meteor.Error("Cannot remove minutes from meeting series", "You are not moderator of this meeting series.");
        }
    }
});
