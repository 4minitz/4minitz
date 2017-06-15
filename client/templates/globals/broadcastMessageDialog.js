import { Meteor } from 'meteor/meteor';
import { formatDateISO8601Time } from '/imports/helpers/date';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

import { BroadcastMessageSchema } from '/imports/collections/broadcastmessages.schema';
import { BroadcastMessage } from '/imports/broadcastmessage';

Template.broadcastMessageDialog.onCreated(function () {
    this.subscribe('broadcastmessage');
});

Template.broadcastMessageDialog.helpers({

    // just a little reactive trigger to show the modal msg dialog
    'showBroadcastMessages': function () {
        const msgCount = BroadcastMessageSchema.find(
            {$and: [{isActive: true},
                    {dismissForUserIDs: { $nin: [Meteor.userId()] } }]}).count();
        if (msgCount > 0) {
            Meteor.setTimeout(function () {
                $('#broadcastMessage').modal('show');
            }, 250);
        } else {
            Meteor.setTimeout(function () {
                $('#broadcastMessage').modal('hide');
            }, 250);
        }
        // do not return anything here, or it will be rendered in the page!!!
        return '';
    },

    'broadcastMessages': function () {
        return BroadcastMessageSchema.find(
            {$and: [{isActive: true}
                    , {dismissForUserIDs: { $nin: [Meteor.userId()] } }]}
            , {sort: {createdAt: -1}});
    },

    'formatTimeStamp': function (date) {
        return formatDateISO8601Time(date);
    }
});

Template.broadcastMessageDialog.events({
    'click #btnDismissBroadcast': function (evt) {
        evt.preventDefault();
        BroadcastMessage.dismissForMe();
    }
});
