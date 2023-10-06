import { Meteor } from 'meteor/meteor';

import { BroadcastMessageSchema } from './broadcastmessages.schema';

if (Meteor.isServer) {
    Meteor.publish('broadcastmessage', function () {
        if(this.userId) {
            // publish only messages, that the current user has NOT yet dismissed
            return BroadcastMessageSchema.find(
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
                return BroadcastMessageSchema.find({});
            }
        }
    });
}


Meteor.methods({
    'broadcastmessage.dismiss': function () {
        if (! Meteor.userId()) {
            return;
        }
        console.log(`Dismissing BroadcastMessages for user: ${Meteor.userId()}`);

        BroadcastMessageSchema.find({isActive: true}).forEach(msg => {
            BroadcastMessageSchema.update(
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

        console.log(`New BroadcastMessage from Admin: >${message}<`);

        const id = BroadcastMessageSchema.insert({
            text: message,
            isActive: active,
            createdAt: new Date(),
            dismissForUserIDs: []});
        return id;
    },

    'broadcastmessage.remove': function (messageId) {
        console.log(`broadcastmessage.remove: ${messageId}`);
        if (! Meteor.userId()) {
            return;
        }
        // #Security: Only admin may remove messages
        if (! Meteor.user().isAdmin) {
            throw new Meteor.Error('Cannot remove message', 'You are not admin.');
        }

        BroadcastMessageSchema.remove(messageId);
    },

    'broadcastmessage.toggleActive': function (messageId) {
        console.log(`broadcastmessage.toggleActive: ${messageId}`);
        if (! Meteor.userId()) {
            return;
        }
        // #Security: Only admin may remove messages
        if (! Meteor.user().isAdmin) {
            throw new Meteor.Error('Cannot remove message', 'You are not admin.');
        }

        let msg = BroadcastMessageSchema.findOne(messageId);
        if (msg) {
            if (msg.isActive) {
                BroadcastMessageSchema.update(messageId,
                    {$set: {isActive: false}});
            } else {
                BroadcastMessageSchema.update(messageId,
                    {$set: {isActive: true, createdAt: new Date(), dismissForUserIDs: []}});
            }
        }
    }
});
