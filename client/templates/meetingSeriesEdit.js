
import { MeetingSeries } from './../../imports/meetingseries'


Template.meetingSeriesEdit.helpers({
 //add you helpers here
});

Template.meetingSeriesEdit.events({
    "click #btnMeetingSeriesSave": function (evt, tmpl) {
        evt.preventDefault();

        var aProject = tmpl.find("#id_meetingproject").value;
        var aName = tmpl.find("#id_meetingname").value;

        // validate form and show errors
        let projectNode = tmpl.$("#id_meetingproject");
        let nameNode = tmpl.$("#id_meetingname");
        projectNode.parent().removeClass("has-error");
        nameNode.parent().removeClass("has-error");
        if (aProject == "") {
            projectNode.parent().addClass("has-error");
            projectNode.focus();
            return;
        }
        if (aName == "") {
            nameNode.parent().addClass("has-error");
            nameNode.focus();
            return;
        }

        ms = new MeetingSeries(this._id);
        ms.project = aProject;
        ms.name = aName;
        ms.save();

        // Hide modal dialog
        $('#dlgEditMeetingSeries').modal('hide');
    }
});

Template.meetingSeriesEdit.onCreated(function() {
    //add your statement here
});

Template.meetingSeriesEdit.onRendered(function() {
    //add your statement here
});

Template.meetingSeriesEdit.onDestroyed(function() {
    //add your statement here
});

