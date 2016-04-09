// Meetings = new Mongo.Collection("meetings");

Template.meetingSeriesAdd.onCreated(function () {
    //add your statement here
    //$('.tooltipped').tooltip({delay: 50});
});

Template.meetingSeriesAdd.helpers({
    //add you helpers here
});

Template.meetingSeriesAdd.events({
    "click #btnSave": function (event, template) {
        event.preventDefault();
        var aProject = template.find("#id_meetingproject").value;
        var aName = template.find("#id_meetingname").value;
        if (aProject == "" || aName == "") {
            return;
        }

        Meteor.call("addMeetingSeries", aProject, aName);

        // Clear form
        $('form')[0].reset();

        //toast('I am a toast!', 4000); // 4000 is the duration of the toast
        //Router.go("/");     // go back to home screen
    }
});
