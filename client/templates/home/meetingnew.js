// Meetings = new Mongo.Collection("meetings");

Template.meetingnew.created = function () {
    //add your statement here 
};

Template.meetingnew.helpers({
    //add you helpers here
});

Template.meetingnew.events({
    "click #btnSave": function (event, template) {
        event.preventDefault();
        aProject = template.find("#id_meetingproject").value;
        aName = template.find("#id_meetingname").value;
        if (aProject == "" || aName == "") {
            return;
        }

        Meteor.call("addMeeting", aProject, aName);

        Router.go("/");     // go back to home screen
    }
});
