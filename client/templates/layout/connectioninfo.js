import { Meteor } from 'meteor/meteor'

Template.connectionInfo.helpers({
    connectionStatus() {
        return Meteor.status();
    },

    connectionWaitTime() {
        var secondsToRetry = (Meteor.status().retryTime - (new Date()).getTime())/1000;
        return Math.round(secondsToRetry);
    }
});

Template.connectionInfo.events({
    "click #btnConnectionLost": function (evt, tmpl) {
        evt.preventDefault();
        console.log("Trying to reconnect...");
        Meteor.reconnect();
    }
});
