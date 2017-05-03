import { Meteor } from 'meteor/meteor'
import {ReactiveVar} from 'meteor/reactive-var'

Template.connectionInfo.onCreated(function() {
    this.currentSymbol = new ReactiveVar(false);
});


Template.connectionInfo.helpers({
    connectionStatus() {
        return Meteor.status();
    },

    connectionWaitTime() {
        const secondsToRetry = (Meteor.status().retryTime - (new Date()).getTime())/1000;
        return Math.round(secondsToRetry);
    },

    currentSymbol: function() {
        return Template.instance().currentSymbol.get();
    }


});

Template.connectionInfo.events({

    "click #btnWarningExpandCollapse": function (evt, tmpl) {
        evt.preventDefault();
        let warningMessage = document.getElementById("warningMessage");
        warningMessage.style.display = (warningMessage.style.display === "none") ? "inline-block" : "none";
        tmpl.currentSymbol.set(!tmpl.currentSymbol.get());
    },

    "click #btnReconnect": function (evt, tmpl) {
        evt.preventDefault();
        console.log("Trying to reconnect...");
        Meteor.reconnect();
    }

});
