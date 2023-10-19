import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { ReactiveVar } from "meteor/reactive-var";
import $ from "jquery";

let templateInstance; // allow showDelay() to access the template

Template.connectionInfo.onCreated(function () {
  this.currentSymbol = new ReactiveVar(false);
  this.connectionLost = new ReactiveVar(false);
});

// We delay the display of connection info dialog to make sure
// the connection lost lasts longer than xx secs.
// This should prevent flashing of this warning during app bootstrapping
const showWithDelay = () => {
  if (!Meteor.status().connected) {
    $("#connectionLostWarning").fadeIn("slow");
    // the reactive var triggers connectionLost() helper, which will trigger blaze to show
    templateInstance.connectionLost.set(true);
  }
};

Template.connectionInfo.helpers({
  connectionLost() {
    templateInstance = Template.instance();
    const cl = Template.instance().connectionLost.get();

    if (Meteor.status().connected) {
      if (cl === true) {
        Template.instance().connectionLost.set(false);
      }
    } else if (cl === false) {
      // delay & fade in  - only once per connection lost!
      Meteor.setTimeout(showWithDelay, 3000);
    }
    return Template.instance().connectionLost.get();
  },

  connectionStatus() {
    return Meteor.status();
  },

  connectionWaitTime() {
    const secondsToRetry =
      (Meteor.status().retryTime - new Date().getTime()) / 1000;
    return Math.round(secondsToRetry);
  },

  currentSymbol() {
    return Template.instance().currentSymbol.get();
  },
});

Template.connectionInfo.events({
  "click #btnWarningExpandCollapse": function (evt, tmpl) {
    evt.preventDefault();
    const warningMessage = document.getElementById("warningMessage");
    warningMessage.style.display =
      warningMessage.style.display === "none" ? "inline-block" : "none";
    tmpl.currentSymbol.set(!tmpl.currentSymbol.get());
  },

  "click #btnReconnect": function (evt) {
    evt.preventDefault();
    console.log("Trying to reconnect...");
    Meteor.reconnect();
  },
});
