import { GlobalSettings } from '/imports/GlobalSettings';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.navigation.onRendered(function() {
});

Template.navigation.helpers({
    "logoHTML": function () {
      return GlobalSettings.getBrandingLogoHTML();
    },

    "isAdmin"() {
        return Session.get("users.isAdmin");
    }
});

Template.navigation.events({
  "click li #navbar-signout": function(event) {
    event.preventDefault();
    if (Meteor.userId()) {
      AccountsTemplates.logout();
      FlowRouter.go("/");
    }
  }
});
