import { MeetingSeries } from '/imports/meetingseries';
import { $ } from 'meteor/jquery';

Template.meetingSeriesAdd.onCreated(function () {
});

Template.meetingSeriesAdd.onRendered(function () {
    $.material.init();
});

Template.meetingSeriesAdd.events({
    "submit #id_meetingSeriesAddForm": function (event, template) {
        event.preventDefault();

        var aProject = template.find("#id_meetingproject").value;
        var aName = template.find("#id_meetingname").value;

        let ms = new MeetingSeries({
            project: aProject,
            name: aName,
            createdAt: new Date()
        });

        ms.save((error) => {
            if (error) {
                Session.set('errorTitle', 'Error');
                Session.set('errorReason', error.reason);
            } else {
                // Clear form
                template.find("#id_meetingproject").value = "";
                template.find("#id_meetingname").value = "";
                template.find("#id_meetingproject").focus();
            }
        });
    },

    "shown.bs.collapse #collapseMeetingSeriesAdd": function (evt, tmpl) {
        tmpl.find("#id_meetingproject").focus();
    }

});
