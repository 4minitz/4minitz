
import { MeetingSeries } from '/imports/meetingseries'

Template.meetingSeriesAdd.onCreated(function () {
});

Template.meetingSeriesAdd.onRendered(function () {
    $.material.init();
});


Template.meetingSeriesAdd.helpers({
    //add you helpers here
});

async function addMeetingSeries(template, optimisticUICallback) {

    let aProject = template.find("#id_meetingproject").value;
    let aName = template.find("#id_meetingname").value;

    let ms = new MeetingSeries({
        project: aProject,
        name: aName,
        createdAt: new Date()
    });

    try {
        await ms.save(optimisticUICallback);
    } catch (error) {
        Session.set('errorTitle', 'Error');
        Session.set('errorReason', error.reason);
    }
}

Template.meetingSeriesAdd.events({
    "click #btnAdd": async function (event, template) {
        event.preventDefault();

        addMeetingSeries(template);

        // Clear form
        template.find("#id_meetingproject").value = "";
        template.find("#id_meetingname").value = "";
        template.find("#id_meetingproject").focus();
    },

    "click #btnAddInvite": async function (event, template) {
        event.preventDefault();

        addMeetingSeries(template, (id) => {
            Router.go('/meetingseries/invite/' + id);
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
