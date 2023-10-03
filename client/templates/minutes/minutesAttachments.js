import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { ReactiveVar } from "meteor/reactive-var";

import { ConfirmationDialogFactory } from "../../helpers/confirmationDialogFactory";

import { Minutes } from "/imports/minutes";
import { UserRoles } from "/imports/userroles";
import { User } from "/imports/user";
import { Attachment } from "/imports/attachment";
import { msToHHMMSS, formatDateISO8601Time } from "/imports/helpers/date";
import { i18n } from "meteor/universe:i18n";

let _minutesID; // the ID of these minutes

let isModerator = function () {
  let aMin = new Minutes(_minutesID);
  return aMin?.isCurrentUserModerator();
};

Template.minutesAttachments.onCreated(function () {
  this.currentUpload = new ReactiveVar(false);
  _minutesID = this.data._id;
  console.log("minutesAttachment on minutes.id:" + _minutesID);

  // Calculate initial expanded/collapsed state
  Session.set("attachments.expand", true);
  // Collapse for non-Moderators, if no attachments there
  if (Attachment.countForMinutes(_minutesID) === 0 && isModerator() === false) {
    Session.set("attachments.expand", false);
  }
});

Template.minutesAttachments.onRendered(function () {
  //add your statement here
});

Template.minutesAttachments.onDestroyed(function () {
  //add your statement here
});

Template.minutesAttachments.helpers({
  attachmentsEnabled() {
    return Meteor.settings.public.attachments.enabled;
  },

  isAttachmentsExpanded() {
    let min = new Minutes(_minutesID);
    if (min.isFinalized && Attachment.countForMinutes(_minutesID) === 0) {
      return false;
    }

    return Session.get("attachments.expand");
  },

  attachments() {
    return Attachment.findForMinutes(_minutesID);
  },

  attachmentsCountText() {
    const count = Attachment.countForMinutes(_minutesID);
    return count === 1 ? count + " file" : count + " files";
  },

  attachmentsCount() {
    return Attachment.countForMinutes(_minutesID);
  },

  currentUpload() {
    return Template.instance().currentUpload.get();
  },

  showUploadButton() {
    let min = new Minutes(_minutesID);
    let ur = new UserRoles();
    return Boolean(
      !min.isFinalized && ur.isUploaderFor(min.parentMeetingSeriesID()),
    );
  },

  showAttachmentRemoveButton() {
    let file = this.fetch()[0]; // this is an attachment cursor in this context, so get "first" object of array
    try {
      let attachment = new Attachment(file._id);
      return attachment.mayRemove();
    } catch (err) {
      // when attachment is in the process of being removed
      // new Attachment(id) may fail...
      // we handle this situation gracefully
      return false;
    }
  },

  uploadSpeed() {
    if (
      Template.instance().currentUpload.get() &&
      Template.instance().currentUpload.get().state.get() === "active"
    ) {
      let speed = Template.instance().currentUpload.get().estimateSpeed.get();
      speed = speed / 1024 / 1024;
      return "@" + speed.toFixed(2) + " MB/s";
    }
    return "";
  },

  timeToFinish() {
    if (
      Template.instance().currentUpload.get() &&
      Template.instance().currentUpload.get().state.get() === "active"
    ) {
      let time = Template.instance().currentUpload.get().estimateTime.get();
      time = msToHHMMSS(time);
      return time + " remaining";
    }
    return "";
  },

  uploaderUsername() {
    let file = this.fetch()[0]; // this is an attachment cursor in this context, so get "first" object of array
    let usr = new User(file.userId);
    return usr.profileNameWithFallback();
  },

  uploadTimestamp() {
    let file = this.fetch()[0]; // this is an attachment cursor in this context, so get "first" object of array
    return formatDateISO8601Time(file.meta.timestamp);
  },
});

Template.minutesAttachments.events({
  "change #btnUploadAttachment": function (e, template) {
    if (e.currentTarget.files?.[0]) {
      // We upload only one file, in case
      // multiple files were selected
      const uploadFilename = e.currentTarget.files[0];
      console.log("Uploading... " + uploadFilename);
      let minObj = new Minutes(_minutesID);
      Attachment.uploadFile(uploadFilename, minObj, {
        onStart: (fileUploadObj) => {
          template.currentUpload.set(fileUploadObj);
        },
        onEnd: (error) => {
          if (error) {
            ConfirmationDialogFactory.makeErrorDialog(
              i18n.__("Minutes.Upload.error"),
              String(error),
            ).show();
          }
          template.currentUpload.set(false);
        },
        onAbort: () => {
          console.log("Upload of attachment was aborted.");
          template.currentUpload.set(false);
        },
      });
    }
  },

  "click #btnDelAttachment": function (evt) {
    evt.preventDefault();
    console.log("Remove Attachment: " + this._id);

    ConfirmationDialogFactory.makeWarningDialog(
      () => {
        Meteor.call("attachments.remove", this._id);
      },
      undefined, // use default 'Confirm delete?"
      i18n.__("Dialog.confirmDeleteAttachment", { name: this.name }),
    ).show();
  },

  "click #btnToggleUpload": function (e) {
    e.preventDefault();
    this.toggle();
    return false;
  },

  "click #btnAbortUpload": function (e) {
    e.preventDefault();
    this.abort();
    return false;
  },

  "click #btnAttachmentsExpand"() {
    Session.set("attachments.expand", !Session.get("attachments.expand"));
  },
});
