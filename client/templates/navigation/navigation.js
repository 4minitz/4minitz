Template.navigation.onRendered(function() {
  $(".button-collapse").sideNav({
    closeOnClick: true
  });
  $(".dropdown-button").dropdown();
});


Template.navigation.events({
  "click li #navbar-signout": function(event) {
    event.preventDefault();
    if (Meteor.userId()) {
      AccountsTemplates.logout();
    }
  }
});
