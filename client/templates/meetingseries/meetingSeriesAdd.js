import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';

import { MeetingSeries } from '/imports/meetingseries';

function clearForm(template) {
    template.find("#id_meetingproject").value = "";
    template.find("#id_meetingname").value = "";
    template.find("#id_meetingproject").focus();
}

function escapeHandler(event) {
    event.preventDefault();

    let escapeWasPressed = event.key == 'Escape';

    // for browsers that do not support event.key yet
    escapeWasPressed |= event.keyCode === 27;

    if (escapeWasPressed) {
        $('#collapseMeetingSeriesAdd').collapse('hide');
    }
}

async function addMeetingSeries(template, optimisticUICallback, doClearForm = true) {

    let aProject = template.find("#id_meetingproject").value;
    let aName = template.find("#id_meetingname").value;

    let ms = new MeetingSeries({
        project: aProject,
        name: aName,
        createdAt: new Date()
    });

    try {
        await ms.save(optimisticUICallback);
        if (doClearForm) {
            clearForm(template);
        }
    } catch (error) {
        Session.set('errorTitle', 'Error');
        Session.set('errorReason', error.reason);
    }
}

Template.meetingSeriesAdd.helpers({
    isExpanded: function () {
        return Session.get("meetingSeriesAdd.isExpanded");
    }
});

Template.meetingSeriesAdd.events({
    "click #btnAddInvite" (event, template) {
        event.preventDefault();
        let aProject = template.find("#id_meetingproject").value;
        let aName = template.find("#id_meetingname").value;
        if (aProject === "" || aName === "") {
            return;
        }

        $('#collapseMeetingSeriesAdd').collapse('hide');

        addMeetingSeries(template, (id) => {
            FlowRouter.go('/meetingseries/' + id + '?edit=true');
        }, false);
    },

    "hidden.bs.collapse #collapseMeetingSeriesAdd"(evt, tmpl) {
        clearForm(tmpl);
        Session.set("meetingSeriesAdd.isExpanded", false);
        document.removeEventListener('keyup', escapeHandler);
    },

    "shown.bs.collapse #collapseMeetingSeriesAdd"(evt, tmpl) {
        tmpl.find("#id_meetingproject").focus();
        Session.set("meetingSeriesAdd.isExpanded", true);
        document.addEventListener('keyup', escapeHandler);
    }
});
