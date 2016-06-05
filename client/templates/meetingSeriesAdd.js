
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
    "click #btnAdd": async function (event, template) {
        event.preventDefault();

        var aProject = template.find("#id_meetingproject").value;
        var aName = template.find("#id_meetingname").value;

        let ms = new MeetingSeries({
            project: aProject,
            name: aName,
            createdAt: new Date()
        });

        try {
            await ms.save();

            // Clear form
            template.find("#id_meetingproject").value = "";
            template.find("#id_meetingname").value = "";
            template.find("#id_meetingproject").focus();
        } catch (error) {
            Session.set('errorTitle', 'Error');
            Session.set('errorReason', error.reason);
        }
    }
});
