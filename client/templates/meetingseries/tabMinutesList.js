import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";
import { MeetingSeries } from "/imports/meetingseries";
import { UserRoles } from "/imports/userroles";
import { AttachmentsCollection } from "/imports/collections/attachments_private";
import { handleError } from "/client/helpers/handleError";
import { i18n } from "meteor/universe:i18n";

Template.tabMinutesList.helpers({
  meetingSeriesId: function () {
    return this.meetingSeriesId;
  },

  addMinutesDisabled: function () {
    let ms = new MeetingSeries(this.meetingSeriesId);
    if (ms.addNewMinutesAllowed()) {
      return {};
    } else {
      return { disabled: true };
    }
  },

  isModeratorOfParentSeries: function () {
    let usrRole = new UserRoles();
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
    let ms = new MeetingSeries(this.meetingSeriesId);
    ms.addNewMinutes(
      (newMinutesId) => {
        FlowRouter.redirect("/minutesedit/" + newMinutesId);
      },
      // server callback
      handleError,
    );
  },

  "click #btnLeaveMeetingSeries": function () {
    let ms = new MeetingSeries(this.meetingSeriesId);

    let leaveSeriesCallback = () => {
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
