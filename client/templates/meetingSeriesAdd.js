import { MeetingSeries } from '/imports/meetingseries';
import submitOnEnter from '../helpers/submitOnEnter';
import { $ } from 'meteor/jquery';

Template.meetingSeriesAdd.onCreated(function () {
});

Template.meetingSeriesAdd.onRendered(function () {
    $.material.init();

    submitOnEnter(['#id_meetingproject', '#id_meetingname'], [], () => {
        $('#btnAdd').click();
    });
});


Template.meetingSeriesAdd.helpers({
    //add you helpers here
});

Template.meetingSeriesAdd.events({
    "click #btnAdd": function (event, template) {
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

    "show.bs.collapse #collapseMeetingSeriesAdd": function (evt, tmpl) {
        // tmpl.find('#id_meetingproject').value = "";
        // tmpl.find('#id_meetingname').value = "";
    },

    "shown.bs.collapse #collapseMeetingSeriesAdd": function (evt, tmpl) {
        tmpl.find("#id_meetingproject").focus();
    }

});
