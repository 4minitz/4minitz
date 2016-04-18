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
    'minutes.insert'(doc) {
        // check(text, String);

        // If app has activated accounts ...
        // Make sure the user is logged in before inserting a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Inject userId to specify owner of doc
        //doc.userId = Meteor.userId();

        MinutesCollection.insert(doc, function(error, newMinutesID) {
            doc._id = newMinutesID;
            if (!error) {
                // store this new minutes ID to the parent meeting's array "minutes"
                var parentMeetingSeries = MeetingSeries.findOne(doc.meetingSeries_id);
                parentMeetingSeries.minutes.push(newMinutesID);
                parentMeetingSeries.save();

                // After we initialized the new minutes, we publish the ID via Session
                // This is needed by the minutesadd/ => minutesedit/ route
                if (Meteor.isClient) {
                    Session.set("currentMinutesID", newMinutesID);
                }
            }
        });
    },

    'minutes.update'(doc) {
        let id = doc._id;
        delete doc._id; // otherwise collection.update will fail

        if (id == undefined || id == "") {
            return;
        }

        // If app has activated accounts ...
        // Make sure the user is logged in before updating a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not update documents of other users
        // MinutesCollection.update({_id: id, userId: Meteor.userId()}, {$set: docPart});
        MinutesCollection.update(doc._id, {$set: doc});
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
        MinutesCollection.update(doc._id, {$set: docPart});
    },


    'minutes.remove'(id) {
        if (id == undefined || id == "")
            return;

        // If app has activated accounts ...
        // Make sure the user is logged in before removing a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not remove documents of other users
        // MinutesCollection.remove({_id: id, userId: Meteor.userId()});
        MinutesCollection.remove(id);
    }
});
