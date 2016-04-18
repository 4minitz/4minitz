/**
 * Created by wok on 16.04.16.
 */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { MeetingSeries } from './../meetingseries'

export var MeetingSeriesCollection = new Mongo.Collection("meetingSeries",
    {
        transform: function (doc) {
            return new MeetingSeries(doc);
        }
    }
);

if (Meteor.isServer) {
    Meteor.publish('meetingSeries', function meetingSeriesPublication() {
        return MeetingSeriesCollection.find();
    });
}
if (Meteor.isClient) {
    Meteor.subscribe('meetingSeries');
}

Meteor.methods({
    'meetingseries.insert'(doc) {
        console.log("meetingseries.insert");
        // check(text, String);

        // If app has activated accounts ...
        // Make sure the user is logged in before inserting a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Inject userId to specify owner of doc
        //doc.userId = Meteor.userId();

        MeetingSeriesCollection.insert(doc, function(error, newMeetingSeriesID) {
            doc._id = newMeetingSeriesID;
        });

    },

    'meetingseries.update'(doc) {
        console.log("meetingseries.update:"+doc.minutes);
        let id = doc._id;
        delete doc._id; // otherwise collection.update will fail
        if (id == undefined || id == "")
            return;

        // If app has activated accounts ...
        // Make sure the user is logged in before updating a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not update documents of other users
        // MeetingSeriesCollection.update({_id: id, userId: Meteor.userId()}, {$set: doc});
        MeetingSeriesCollection.update(id, {$set: doc});
    },

    'meetingseries.remove'(id) {
        console.log("meetingseries.remove:"+id);
        if (id == undefined || id == "")
            return;

        // If app has activated accounts ...
        // Make sure the user is logged in before removing a task
        //if (!Meteor.userId()) {
        //    throw new Meteor.Error('not-authorized');
        //}
        // Ensure user can not remove documents of other users
        // MeetingSeriesCollection.remove({_id: id, userId: Meteor.userId()});
        MeetingSeriesCollection.remove(id);
    }
});
