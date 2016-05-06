/**
 * Created by wok on 16.04.16.
 */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { MeetingSeries } from './../meetingseries'
import { Minutes } from "./../minutes"
import { UserRoles } from "./../userroles"

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

Meteor.methods({
    'meetingseries.insert'(doc) {
        console.log("meetingseries.insert");
        // check(text, String);

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // the user should not be able to define the date when this series was create - or should he?
        // -> so we overwrite this field if it was set previously
        let currentDate = new Date();
        doc.createdAt = currentDate;
        doc.lastMinutesDate = formatDateISO8601(currentDate);

        // Ensure initialization of some fields
        if (doc.minutes == undefined) {
            doc.minutes = [];
        }
        if (doc.openTopics == undefined) {
            doc.openTopics =  [];
        }
        if (doc.closedTopics == undefined) {
            doc.closedTopics =  [];
        }

        // limit visibility of this meeting series (see server side publish)
        // array will be expanded by future invites
        doc.visibleFor = [Meteor.userId()];

        MeetingSeriesCollection.insert(doc, function(error, newMeetingSeriesID) {
            doc._id = newMeetingSeriesID;
            // Make creator of this meeting series the first moderator
            Roles.addUsersToRoles(Meteor.userId(), [UserRoles.ROLE_MODERATOR], newMeetingSeriesID);
        });
    },

    'meetingseries.update'(doc) {
        console.log("meetingseries.update:"+doc.minutes);
        let id = doc._id;
        delete doc._id; // otherwise collection.update will fail
        if (id == undefined || id == "")
            return;

        // TODO: fix security issue: it is not allowed to modify (e.g. remove) elements from the minutes array!

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not update documents of other users
        // MeetingSeriesCollection.update({_id: id, userId: Meteor.userId()}, {$set: doc});
        MeetingSeriesCollection.update(id, {$set: doc});
    },

    'meetingseries.remove'(id) {
        console.log("meetingseries.remove:"+id);
        if (id == undefined || id == "")
            return;

        // Make sure the user is logged in before changing collections
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Ensure user can not remove documents of other users
        // MeetingSeriesCollection.remove({_id: id, userId: Meteor.userId()});
        MeetingSeriesCollection.remove(id);
    },

    'meetingseries.removeMinutesFromArray'(meetingSeriesId, minutesId) {
        console.log("meetingseries.removeMinutesFromArray: MeetingSeries ("
            + meetingSeriesId + "), Minutes (" + minutesId + ")");

        // Minutes can only be removed as long as they are not finalized
        let aMin = new Minutes(minutesId);
        if (aMin.isFinalized) return;

        MeetingSeriesCollection.update(meetingSeriesId, {$pull: {'minutes': minutesId}});
    }
});
