import { Meteor } from 'meteor/meteor'

let isCollapsedWarningMessage = new ReactiveVar(false);

Template.connectionInfo.helpers({
    connectionStatus() {
        return Meteor.status();
    },

    connectionWaitTime() {
        var secondsToRetry = (Meteor.status().retryTime - (new Date()).getTime())/1000;
        return Math.round(secondsToRetry);
    },

    isCollapsedWarningMessage2() {
        console.log("Property");
        console.log(isCollapsedWarningMessage);
        return isCollapsedWarningMessage;
    }
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
        if(warningMessage.style.display == "none") {
            warningMessage.style.display = "inline-block";
            let btnLeft = document.getElementsByClassName("btnWarningExpandCollapseLeft");
            let btnBottom = document.getElementsByClassName("btnWarningExpandCollapseBottom");
            btnLeft.style.display = "none";
            btnBottom.style.display = "inline-block";
            isCollapsedWarningMessage = false;
        }
        else if(warningMessage.style.display == "inline-block" || warningMessage.style.display == ""){
            warningMessage.style.display = "none";
            let btnBottom = document.getElementsByClassName("btnWarningExpandCollapseBottom");
            let btnLeft = document.getElementsByClassName("btnWarningExpandCollapseLeft");
            btnLeft.style.display = "inline-block";
            btnBottom.style.display = "none";
            isCollapsedWarningMessage = true;
        }
    }
});
