import { handleError } from "/client/helpers/handleError";
import { AttachmentsCollection } from "/imports/collections/attachments_private";
import { MeetingSeries } from "/imports/meetingseries";
import { UserRoles } from "/imports/userroles";
import { Meteor } from "meteor/meteor";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";

Template.tabMinutesList.helpers({
  meetingSeriesId() {
    return this.meetingSeriesId;
  },

  addMinutesDisabled() {
    const ms = new MeetingSeries(this.meetingSeriesId);
    return ms.addNewMinutesAllowed() ? {} : { disabled: true };
  },

  isModeratorOfParentSeries() {
    const usrRole = new UserRoles();
    return usrRole.isModeratorOf(this.meetingSeriesId);
  },

  hasAttachments() {
    return Boolean(
      AttachmentsCollection.findOne({ "meta.meetingminutes_id": this._id }),
    );
  },
});

Template.tabMinutesList.events({
  "click #btnAddMinutes": function (evt) {
    evt.preventDefault();
    const ms = new MeetingSeries(this.meetingSeriesId);
    ms.addNewMinutes(
      (newMinutesId) => {
        FlowRouter.redirect(`/minutesedit/${newMinutesId}`);
      },
      // server callback
      handleError,
    );
  },

  "click #btnLeaveMeetingSeries": function () {
    const ms = new MeetingSeries(this.meetingSeriesId);

    const leaveSeriesCallback = () => {
      console.log(
        "User: " +
          Meteor.user().username +
          " is leaving Meeting Series: " +
          this.meetingSeriesId,
      );
      MeetingSeries.leave(ms).catch(handleError());
      FlowRouter.go("/");
    };

    ConfirmationDialogFactory.makeWarningDialog(
      leaveSeriesCallback,
      i18n.__("MeetingSeries.leave"),
      i18n.__("Dialog.confirmLeaveMeetingSeries", {
        project: ms.project,
        name: ms.name,
      }),
      {},
      i18n.__("MeetingSeries.leaveButton"),
    ).show();
  },
});
