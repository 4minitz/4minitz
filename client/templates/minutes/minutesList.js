import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ConfirmationDialog } from '../../helpers/confirmationDialog';
import { TemplateCreator } from '../../helpers/templateCreator';

import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'
import { AttachmentsCollection } from "/imports/collections/attachments_private"

Template.minutesList.helpers({
    buttonBackground: function () {
        return (this.isFinalized) ? "default" : "info";
    },

    meetingSeriesId: function () {
        return this.meetingSeriesId;
    },

    addMinutesDisabled: function () {
        let ms = new MeetingSeries(this.meetingSeriesId);
        if (ms.addNewMinutesAllowed()) {
            return {};
        } else {
            return {disabled: true};
        }
    },

    isDeleteAllowed: function () {
        return (!this.isFinalized);
    },

    isModeratorOfParentSeries: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(this.meetingSeriesId);
    },

    hasAttachments() {
        return !!AttachmentsCollection.findOne({"meta.meetingminutes_id": this._id});
    }
});

Template.minutesList.events({
    "click #btnLeaveMeetingSeries": function () {
        let ms = new MeetingSeries(this.meetingSeriesId);

        let leaveSeriesCallback = () => {
            console.log("User: "+Meteor.user().username+" is leaving Meeting Series: " + this.meetingSeriesId);
            MeetingSeries.leave(ms);
            FlowRouter.go("/");
        };

        let dialogTmpl = TemplateCreator.create(
            "<p>Do you really want to leave the meeting series:<br>" +
            "&nbsp;&nbsp;&nbsp;&nbsp;<b>{{project}} / {{name}}</b><br>" +
            "You will have to ask a moderator if you want to join again afterwards.</p>"
        );

        ConfirmationDialog.makeWarningDialogWithTemplate(
            leaveSeriesCallback,
            'Leave Meeting Series',
            dialogTmpl,
            {
                project: ms.project,
                name: ms.name
            },
            'Leave'
        ).show();

    }
});