import { MeetingSeries } from '/imports/meetingseries';
import { $ } from 'meteor/jquery';

Template.meetingSeriesAdd.onRendered(function () {
    $.material.init();
});

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

Template.meetingSeriesAdd.events({
    "submit #id_meetingSeriesAddForm"(event, template) {
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
                clearForm(template);
            }
        });
    },

    "hidden.bs.collapse #collapseMeetingSeriesAdd"(evt, tmpl) {
        clearForm(tmpl);
        document.removeEventListener('keyup', escapeHandler);
    },

    "shown.bs.collapse #collapseMeetingSeriesAdd"(evt, tmpl) {
        tmpl.find("#id_meetingproject").focus();
        document.addEventListener('keyup', escapeHandler);
    }

});
