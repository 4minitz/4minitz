import { Meteor } from 'meteor/meteor';

export let BroadcastMessageCollection = new Mongo.Collection("broadcastmessage");

if (Meteor.isServer) {
    Meteor.publish('broadcastmessage', function () {
        if(this.userId) {
            // publish only messages, that the current user has NOT yet dismissed
            return BroadcastMessageCollection.find({dismissForUserIDs: {$nin: [this.userId]}});
        }
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('broadcastmessage');
}

Meteor.methods({
    "broadcastmessage.dismiss": function () {
        console.log("Dismissing BroadcastMessages for user: "+Meteor.userId());
        if (! Meteor.userId()) {
            return;
        }

        BroadcastMessageCollection.find().forEach(msg => {
            BroadcastMessageCollection.update(
                {_id: msg._id},
                {$addToSet: {dismissForUserIDs: Meteor.userId()}})
            }
        );
    }
});