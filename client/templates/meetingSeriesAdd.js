
import { MeetingSeries } from '/imports/meetingseries'

Template.meetingSeriesAdd.onCreated(function () {
});

Template.meetingSeriesAdd.onRendered(function () {
    $.material.init();
});


Template.meetingSeriesAdd.helpers({
    //add you helpers here
});

Template.meetingSeriesAdd.events({
    "click #btnAdd": function (event, template) {
        event.preventDefault();

        var aProject = template.find("#id_meetingproject").value;
        var aName = template.find("#id_meetingname").value;
        if (aProject == "" || aName == "") {
            return;
        }

        ms = new MeetingSeries({
            project: aProject,
            name: aName,
            createdAt: new Date()
        });
        ms.save();

        // Clear form
        template.find("#id_meetingproject").value = "";
        template.find("#id_meetingname").value = "";
        template.find("#id_meetingproject").focus();
    }
});
