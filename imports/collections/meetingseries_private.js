import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { MeetingSeries } from './../meetingseries';
import { Minutes } from './../minutes';
import { MeetingSeriesSchema } from './meetingseries.schema';
import { UserRoles } from "./../userroles";
import { GlobalSettings } from "./../GlobalSettings"
import { ServerSyncCollection } from './ServerSyncCollection'

export var MeetingSeriesCollection = new Mongo.Collection("meetingSeries",
    {
        // inject methods of class MeetingSeries to all returned collection docs
        transform: function (doc) {
            return new MeetingSeries(doc);
        }
    }
);

export var MeetingSeriesSyncCollection = new ServerSyncCollection(MeetingSeriesCollection, Meteor);

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

        if (Meteor.isServer) {
            // copy the default labels to the series
            doc.availableLabels = GlobalSettings.getDefaultLabels();
            doc.availableLabels.forEach((label) => {
                label._id = Random.id();
                label.isDefaultLabel = true;
                label.isDisabled = false;
            });
        }

        // Every logged in user is allowed to create a new meeting series.

        let doAfterInsert = function(error, newMeetingSeriesID) {
            if (error) {
                console.error(error);
                throw error;
            }

            if (Meteor.isClient && optimisticUICallback) {
                optimisticUICallback(newMeetingSeriesID);
            }

            doc._id = newMeetingSeriesID;
            // Make creator of this meeting series the first moderator
            Roles.addUsersToRoles(Meteor.userId(), UserRoles.USERROLES.Moderator, newMeetingSeriesID);
        };

        try {
            let newMeetingSeriesID = MeetingSeriesSyncCollection.insert(doc, doAfterInsert);
            if (Meteor.isServer) {
                doAfterInsert(null, newMeetingSeriesID);
                return newMeetingSeriesID;
            }
        } catch(error) {
            doAfterInsert(error);
        }
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

        // these attributes should only be manipulated by specific workflow-methods
        delete doc.minutes;
        delete doc.topics;
        delete doc.openTopics;

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not update documents of other users
        let userRoles = new UserRoles(Meteor.userId());
        if (!userRoles.isModeratorOf(id)) {
            throw new Meteor.Error("Cannot update meeting series", "You are not moderator of this meeting series.");
        }

        try {
            let updateResult = MeetingSeriesCollection.update(id, {$set: doc});
            if (Meteor.isServer && !updateResult) {
                console.error('Error updating meeting series, no docs affected!');
                throw new Meteor.Error('runtime-error', 'No docs affected when updating meeting series');
            }
        } catch(e) {
            console.error(e);
            throw new Meteor.Error('runtime-error', 'Error updating meeting series collection', e);
        }
    }
});
