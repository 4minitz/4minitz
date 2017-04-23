import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ConfirmationDialogFactory } from '../../helpers/confirmationDialogFactory';
import { MeetingSeries } from '/imports/meetingseries';
import { UserRoles } from '/imports/userroles';
import { AttachmentsCollection } from "/imports/collections/attachments_private";
import { handleError } from '/client/helpers/handleError';

Template.tabMinutesList.helpers({
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

    isModeratorOfParentSeries: function () {
        let usrRole = new UserRoles();
        return usrRole.isModeratorOf(this.meetingSeriesId);
    },

    hasAttachments() {
        return !!AttachmentsCollection.findOne({"meta.meetingminutes_id": this._id});
    }
});

Template.tabMinutesList.events({
    "click #btnAddMinutes": function(evt) {
        evt.preventDefault();
        let newMinutesId;
        let ms = new MeetingSeries(this.meetingSeriesId);
        ms.addNewMinutes(
            // optimistic ui callback
            newMinutesID => {
                newMinutesId = newMinutesID
            },
            // server callback
            (error) => {
                if(error) handleError(error);
            }
        );
        if (newMinutesId) { // optimistic ui callback should have been called by now
            FlowRouter.redirect('/minutesedit/' + newMinutesId);
        }
    },

    "click #btnLeaveMeetingSeries": function () {
        let ms = new MeetingSeries(this.meetingSeriesId);

        let leaveSeriesCallback = () => {
            console.log("User: "+Meteor.user().username+" is leaving Meeting Series: " + this.meetingSeriesId);
            MeetingSeries.leave(ms).catch(handleError());
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