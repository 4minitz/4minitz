import { Meteor } from 'meteor/meteor';
import { BroadcastMessage } from '/imports/broadcastmessage';
import { formatDateISO8601Time } from '/lib/helpers';

Template.broadcastMessageDialog.helpers({

    // just a little reactive trigger to show the modal msg dialog
    "showBroadcastMessages": function () {
        const msgCount = BroadcastMessage.find(
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
        return "";
    },

    "broadcastMessages": function () {
        return BroadcastMessage.find(
            {$and: [{isActive: true}
                    , {dismissForUserIDs: { $nin: [Meteor.userId()] } }]}
            , {sort: {createdAt: -1}});
    },

    "formatTimeStamp": function (date) {
        return formatDateISO8601Time(date);
    }
});

Template.broadcastMessageDialog.events({
    "click #btnDismissBroadcast": function (evt, tmpl) {
        BroadcastMessage.dismissForMe();
    }
});

Template.broadcastMessageDialog.onCreated(function () {
});

Template.broadcastMessageDialog.onRendered(function () {
});

Template.broadcastMessageDialog.onDestroyed(function () {
    //add your statement here
});

