Template.navigation.onRendered(function() {
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
