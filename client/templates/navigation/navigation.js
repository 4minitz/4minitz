Template.navigation.onRendered(function() {
});


Template.navigation.events({
  "click li #navbar-signout": function(event) {
    event.preventDefault();
    if (Meteor.userId()) {
      Session.set("currentMinutesID", false);
      AccountsTemplates.logout();
    }
  }
});
