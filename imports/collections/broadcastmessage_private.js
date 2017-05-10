import { Meteor } from 'meteor/meteor';

import { BroadcastMessageSchema } from './broadcastmessages.schema';

export let BroadcastMessageCollection = new Mongo.Collection('broadcastmessage');
BroadcastMessageCollection.attachSchema(BroadcastMessageSchema);

if (Meteor.isServer) {
    Meteor.publish('broadcastmessage', function () {
        if(this.userId) {
            // publish only messages, that the current user has NOT yet dismissed
            return BroadcastMessageCollection.find(
                {$and: [{isActive: true},
                        {dismissForUserIDs: { $nin: [this.userId] } }]});
        }
    });

    // #Security: Admin sees all messages, active & inactive
    // and even messages dismissed by herself!
    Meteor.publish('broadcastmessageAdmin', function () {
        if(this.userId) {
            let usr = Meteor.users.findOne(this.userId);
            if (usr.isAdmin) {
                return BroadcastMessageCollection.find({});
            }
        }
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('broadcastmessage');
    Meteor.subscribe('broadcastmessageAdmin');
}


Meteor.methods({
    'broadcastmessage.dismiss': function () {
        if (! Meteor.userId()) {
            return;
        }
        console.log('Dismissing BroadcastMessages for user: '+Meteor.userId());

        BroadcastMessageCollection.find({isActive: true}).forEach(msg => {
            BroadcastMessageCollection.update(
                {_id: msg._id},
                {$addToSet: {dismissForUserIDs: Meteor.userId()}});
        }
        );
    },

    'broadcastmessage.show': function (message, active=true) {
        if (! Meteor.userId()) {
            return;
        }
        // #Security: Only admin may broadcast messages
        if (! Meteor.user().isAdmin) {
            throw new Meteor.Error('Cannot broadcast message', 'You are not admin.');
        }
        if (! message) {
            return;
        }

        console.log('New BroadcastMessage from Admin: >' + message+'<');

        const id = BroadcastMessageCollection.insert({
            text: message,
            isActive: active,
            createdAt: new Date(),
            dismissForUserIDs: []});
        return id;
    },

    'broadcastmessage.remove': function (messageId) {
        console.log('broadcastmessage.remove: '+messageId);
        if (! Meteor.userId()) {
            return;
        }
        // #Security: Only admin may remove messages
        if (! Meteor.user().isAdmin) {
            throw new Meteor.Error('Cannot remove message', 'You are not admin.');
        }

        BroadcastMessageCollection.remove(messageId);
    },

    'broadcastmessage.toggleActive': function (messageId) {
        console.log('broadcastmessage.toggleActive: '+messageId);
        if (! Meteor.userId()) {
            return;
        }
        // #Security: Only admin may remove messages
        if (! Meteor.user().isAdmin) {
            throw new Meteor.Error('Cannot remove message', 'You are not admin.');
        }

        let msg = BroadcastMessageCollection.findOne(messageId);
        if (msg) {
            if (msg.isActive) {
                BroadcastMessageCollection.update(messageId,
                    {$set: {isActive: false}});
            } else {
                BroadcastMessageCollection.update(messageId,
                    {$set: {isActive: true, createdAt: new Date(), dismissForUserIDs: []}});
            }
        }
    }
});
