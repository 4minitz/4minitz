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

        doc.isFinalized = false;

        MinutesCollection.insert(doc, function (error, newMinutesID) {
            doc._id = newMinutesID;
            if (!error) {
                // store this new minutes ID to the parent meeting's array "minutes"
                var parentMeetingSeries = MeetingSeries.findOne(doc.meetingSeries_id);
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
            isFinalized: true
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

        // If app has activated accounts ...
        // Make sure the user is logged in before updating a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not update documents of other users
        // MinutesCollection.update({_id: id, userId: Meteor.userId()}, {$set: docPart});

        // Ensure user can not update finalized minutes
        MinutesCollection.update({_id: doc._id, isFinalized: false}, {$set: doc});
    },

    'minutes.updateDocPart'(doc, docPart) {
        if (doc._id == undefined || doc._id == "")
            return;

        // If app has activated accounts ...
        // Make sure the user is logged in before updating a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not update documents of other users
        // MinutesCollection.update({_id: id, userId: Meteor.userId()}, {$set: docPart});

        // Ensure user can not update finalized minutes
        MinutesCollection.update({_id: doc._id, isFinalized: false}, {$set: docPart});
    },


    // id may be the actual id (string) or an array of ids which should all be removed
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
                MinutesCollection.remove(id);
            }
        };

        let ids = id;
        if (typeof id === 'string') {
            handleRemove.removeMinute(id);
        }

        for (let i = 0; i < ids.length; i++) {
            handleRemove.removeMinute(ids[i]);
        }
    }
});
