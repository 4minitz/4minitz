import { FlowRouter } from 'meteor/kadira:flow-router';
import { $ } from 'meteor/jquery';
import { MeetingSeries } from '/imports/meetingseries';
import { handleError } from '/client/helpers/handleError';

function clearForm(template) {
    template.find("#id_meetingproject").value = "";
    template.find("#id_meetingname").value = "";
    template.find("#id_meetingproject").focus();
}

function escapeHandler(event) {
    event.preventDefault();

    let escapeWasPressed = event.key === 'Escape';

    // for browsers that do not support event.key yet
    escapeWasPressed |= event.keyCode === 27;

    if (escapeWasPressed) {
        $('#collapseMeetingSeriesAdd').collapse('hide');
    }
}

function addMeetingSeries(template, optimisticUICallback) {

    let aProject = template.find("#id_meetingproject").value;
    let aName = template.find("#id_meetingname").value;

    let ms = new MeetingSeries({
        project: aProject,
        name: aName,
        createdAt: new Date()
    });

    ms.saveAsync(optimisticUICallback).catch(handleError);
}

Template.meetingSeriesAdd.helpers({
    isExpanded: function () {
        return Session.get("meetingSeriesAdd.isExpanded");
    }
});

Template.meetingSeriesAdd.events({
    "submit #id_meetingSeriesAddForm" (event, template) {
        event.preventDefault();
        let aProject = template.find("#id_meetingproject").value;
        let aName = template.find("#id_meetingname").value;
        if (aProject === "" || aName === "") {
            return;
        }

        $('#collapseMeetingSeriesAdd').collapse('hide');

        addMeetingSeries(template, (id) => {
            FlowRouter.go('/meetingseries/' + id + '?edit=true');
        });
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
