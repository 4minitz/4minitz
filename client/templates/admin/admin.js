Template.admin.helpers({
    "isAdmin"() {
        return Session.get("users.isAdmin");
    }
});

Template.admin.events({
 //add your events here
});

Template.admin.onCreated(function() {
    //add your statement here
});

Template.admin.onRendered(function() {
    //add your statement here
});

Template.admin.onDestroyed(function() {
    //add your statement here
});

