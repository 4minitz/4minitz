/**
 * Created by wok on 16.04.16.
 */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Minutes } from '../minutes'
import { MeetingSeries } from '../meetingseries'

export var MinutesCollection = new Mongo.Collection("minutes",
    {
        transform: function (doc) {
            return new Minutes(doc);
        }
    }
);

if (Meteor.isServer) {
    Meteor.publish('minutes', function minutesPublication() {
        return MinutesCollection.find();
    });
}
if (Meteor.isClient) {
    Meteor.subscribe('minutes');
}

Meteor.methods({
    'minutes.insert'(doc, clientCallback) {
        // check(text, String);

        // If app has activated accounts ...
        // Make sure the user is logged in before inserting a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Inject userId to specify owner of doc
        //doc.userId = Meteor.userId();

        // It is not allowed to insert new minutes if the last minute was not finalized
        let parentMeetingSeries = new MeetingSeries(doc.meetingSeries_id);
        if (!parentMeetingSeries.addNewMinutesAllowed()) {
            // last minutes is not finalized!
            throw new Meteor.Error("Cannot create new Minutes", "Last Minutes must be finalized first.");
        }

        // It also not allowed to insert a new minute dated before the last finalized one
        parentMeetingSeries.isMinutesDateAllowed(/*we have no minutes_id*/null, doc.date);

        doc.isFinalized = false;
        doc.isUnfinalized = false;

        MinutesCollection.insert(doc, function (error, newMinutesID) {
            doc._id = newMinutesID;
            if (!error) {
                // store this new minutes ID to the parent meeting's array "minutes"
                parentMeetingSeries.minutes.push(newMinutesID);
                parentMeetingSeries.save();

                if (Meteor.isClient && clientCallback) {
                    clientCallback(newMinutesID);
                }
            }
        });
    },

    'minutes.finalize'(id) {
        let doc = {
            finalizedAt: new Date(),
            finalizedBy: Meteor.userId(),
            isFinalized: true,
            isUnfinalized: false
        };

        // If app has activated accounts ...
        // Make sure the user is logged in before updating a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not update documents of other users
        // MinutesCollection.update({_id: id, userId: Meteor.userId()}, {$set: doc});
        MinutesCollection.update(id, {$set: doc});
    },

    'minutes.unfinalize'(id) {
        let doc = {
            isFinalized: false,
            isUnfinalized: true
        };

        // it is not allowed to un-finalize a minute if it is not the last finalized one
        let aMin = new Minutes(id);
        if (!aMin.parentMeetingSeries().isUnfinalizeMinutesAllowed(id)) {
            throw new Meteor.Error("not-allowed", "This minutes is not allowed to be un-finalized.");
        }

        // If app has activated accounts ...
        // Make sure the user is logged in before updating a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not update documents of other users
        // MinutesCollection.update({_id: id, userId: Meteor.userId()}, {$set: doc});
        MinutesCollection.update(id, {$set: doc});
    },

    'minutes.update'(doc) {
        let id = doc._id;
        delete doc._id; // otherwise collection.update will fail

        if (id == undefined || id == "") {
            return;
        }

        // delete properties which should not be modified by the client
        delete doc.finalizedAt;
        delete doc.createdAt;
        delete doc.isFinalized;

        if (doc.date) {
            let minutes = new Minutes(id);
            if (!minutes.parentMeetingSeries().isMinutesDateAllowed(id, doc.date)) {
                return;
            }
        }

        // If app has activated accounts ...
        // Make sure the user is logged in before updating a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not update documents of other users
        // MinutesCollection.update({_id: id, userId: Meteor.userId()}, {$set: docPart});

        // Ensure user can not update finalized minutes
        MinutesCollection.update({_id: id, isFinalized: false}, {$set: doc});
    },


    'minutes.remove'(id) {
        if (id == undefined || id == "")
            return;

        var handleRemove = {
            removeMinute: function(id) {
                // If app has activated accounts ...
                // Make sure the user is logged in before removing a task
                //if (!Meteor.userId()) {
                //    throw new Meteor.Error('not-authorized');
                //}
                // Ensure user can not remove documents of other users
                // MinutesCollection.remove({_id: id, userId: Meteor.userId()});
                return MinutesCollection.remove({_id: id, isFinalized: false});
            }
        };

        return handleRemove.removeMinute(id);
    },

    'minutes.removeAllOfSeries'(meetingSeriesId) {
        if (meetingSeriesId == undefined || meetingSeriesId == "") {
            return;
        }

        // deleting all minutes of one series is allowed, even if they are finalized.
        MinutesCollection.remove({meetingSeries_id: meetingSeriesId});
    }
});
