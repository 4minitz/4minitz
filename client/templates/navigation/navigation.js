import { GlobalSettings } from '/imports/GlobalSettings'

Template.navigation.onRendered(function() {
});

Template.navigation.helpers({
  "logoHTML": function () {
    return GlobalSettings.getBrandingLogoHTML();
  }
});

Template.navigation.events({
  "click li #navbar-signout": function(event) {
    event.preventDefault();
    if (Meteor.userId()) {
      AccountsTemplates.logout();
      Router.go("/");
    }
  }
});
