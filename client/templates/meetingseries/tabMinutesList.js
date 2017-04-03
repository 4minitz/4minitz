import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';

import { MeetingSeries } from '/imports/meetingseries'
import { UserRoles } from '/imports/userroles'
import { AttachmentsCollection } from "/imports/collections/attachments_private"

Template.tabMinutesList.helpers({
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

Template.tabMinutesList.events({
    "click #btnLeaveMeetingSeries": function () {
        let ms = new MeetingSeries(this.meetingSeriesId);

        let leaveSeriesCallback = () => {
            console.log("User: "+Meteor.user().username+" is leaving Meeting Series: " + this.meetingSeriesId);
            MeetingSeries.leave(ms);
            FlowRouter.go("/");
        };

        ConfirmationDialogFactory.makeWarningDialogWithTemplate(
            leaveSeriesCallback,
            'Leave Meeting Series',
            'confirmLeaveMeetingSeries',
            {
                project: ms.project,
                name: ms.name
            },
            'Leave'
        ).show();

    }
});