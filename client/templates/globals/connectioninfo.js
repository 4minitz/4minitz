import { Meteor } from 'meteor/meteor'

Template.connectionInfo.helpers({
    connectionStatus() {
        return Meteor.status();
    },

    connectionWaitTime() {
        const secondsToRetry = (Meteor.status().retryTime - (new Date()).getTime())/1000;
        return Math.round(secondsToRetry);
    },
});

Template.connectionInfo.events({
    "click #btnConnectionLost": function (evt, tmpl) {
        evt.preventDefault();
        console.log("Trying to reconnect...");
        Meteor.reconnect();
    },

    "click #btnWarningExpandCollapse": function (evt) {
        evt.preventDefault();
        let warningMessage = document.getElementById("warningMessage");
        warningMessage.style.display = (warningMessage.style.display === "none") ? "inline-block" : "none";
    }
});
