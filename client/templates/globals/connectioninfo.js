import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

let connectionLost = false;

Template.connectionInfo.onCreated(function() {
    this.currentSymbol = new ReactiveVar(false);
});


Template.connectionInfo.helpers({
    connectionLost() {
        console.log(connectionLost);
        if (!Meteor.status().connected) {
            if (connectionLost === false) { // delay & fade in  - only once per connection lost!
                $('#connectionLostWarning').hide().delay(2000).fadeIn('slow');
                connectionLost = true;
            }
            return true;
        }
        connectionLost = false;
        return false;
    },

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

    'click #btnWarningExpandCollapse': function (evt, tmpl) {
        evt.preventDefault();
        let warningMessage = document.getElementById('warningMessage');
        warningMessage.style.display = (warningMessage.style.display === 'none') ? 'inline-block' : 'none';
        tmpl.currentSymbol.set(!tmpl.currentSymbol.get());
    },

    'click #btnReconnect': function (evt) {
        evt.preventDefault();
        console.log('Trying to reconnect...');
        Meteor.reconnect();
    }

});
