import { GlobalSettings } from "/imports/config/GlobalSettings";
import { Meteor } from "meteor/meteor";
import { FilesCollection } from "meteor/ostrio:files";

import { Attachment } from "../attachment";
import { Minutes } from "../minutes";
import { UserRoles } from "../userroles";

import { extendedPublishSubscribeHandler } from "./../helpers/extendedPublishSubscribe";

// #Security: html downloads from server might allow XSS
// see https://github.com/VeliovGroup/Meteor-Files/issues/289
const FORBIDDEN_FILENAME_EXTENSIONS = "html|htm|swf";

export const AttachmentsCollection = new FilesCollection({
  collectionName: "AttachmentsCollection",
  allowClientCode: false, // Disallow attachments remove() call from clients
  permissions: 0o0_6_0_0, // #Security: make uploaded files "chmod 600' only
  // readable for server user
  storagePath: Meteor.isServer ? calculateAndCreateStoragePath : undefined, // eslint-disable-line

  // #Security: onBeforeUpload
  // Here we check for upload rights of user and if the file is within in
  // defined limits regarding file size and file extension. User must have
  // upload role or better for meeting series. This will be run in method
  // context on client and(!) server by the Meteor-Files package So, server will
  // always perform the last ultimate check!
  onBeforeUpload(file) {
    if (!GlobalSettings.getAttachmentsEnabled()) {
      return "Upload not allowed in settings.json";
    }
    // Check if this upload candidate is allowed by size and extension
    // This method is called on client and on server
    if (!Meteor.userId()) {
      return "Upload not allowed. No user logged in.";
    }
    if (file.meta === undefined || file.meta.meetingminutes_id === undefined) {
      return "Upload not allowed. File has no target meeting series.";
    }
    // see if user has the uploader role - or better - for this meeting series
    const ur = new UserRoles();
    if (!ur.isUploaderFor(file.meta.parentseries_id)) {
      const msg =
        "Upload not allowed. User has no upload role for this meeting series.";
      console.log(msg);
      return msg;
    }
    // check if minutes is finalized
    const min = new Minutes(file.meta.meetingminutes_id);
    if (min.isFinalized) {
      const msg = "Upload not allowed. Minutes are finalized.";
      console.log(msg);
      return msg;
    }
    // Check for allowed file size
    if (file.size > Meteor.settings.public.attachments.maxFileSize) {
      const maxMB = Math.floor(
        Meteor.settings.public.attachments.maxFileSize / 1024 / 1024,
      );
      return `Please upload file with max. ${maxMB} MB.`;
    }
    // Check for non-allowed file extensions
    if (Meteor.settings.public.attachments.denyExtensions !== undefined) {
      const denyRE = new RegExp(
        `^(${Meteor.settings.public.attachments.denyExtensions})$`,
        "i",
      );
      const forbiddenRE = new RegExp(
        `^(${FORBIDDEN_FILENAME_EXTENSIONS})$`,
        "i",
      );
      if (denyRE.test(file.extension) || forbiddenRE.test(file.extension)) {
        return (
          'Denied file extension: "' +
          file.extension +
          '". Please upload other file type.'
        );
      }
    }
    // If allowExtensions is undefined, every extension is allowed!
    if (Meteor.settings.public.attachments.allowExtensions === undefined) {
      return true;
    }
    // Check for allowed file extensions
    const allowRE = new RegExp(
      `^(${Meteor.settings.public.attachments.allowExtensions})$`,
      "i",
    );
    if (allowRE.test(file.extension)) {
      return true;
    }

    // console.log("Upload attachment '"+fileObj.name +"' for meeting series " +
    // fileObj.meta.parentseries_id);

    return (
      "Non-allowed file extension. Please upload file type of:<br>" +
      Meteor.settings.public.attachments.allowExtensions
    );
  },

  onAfterUpload(file) {
    console.log(
      "Successfully uploaded attachment file: " +
        file.name +
        " to " +
        file.path,
    );
    AttachmentsCollection.update(file._id, {
      $set: { "meta.timestamp": new Date() },
    });
  },
  // #Security: downloadCallback
  // Here we check for download rights of user, which equals to the "invited"
  // role - or better. This will be run in method context on client and(!)
  // server by the Meteor-Files package So, server will always perform the last
  // ultimate check!
  downloadCallback(file) {
    if (!this.userId) {
      console.log("Attachment download prohibited. User not logged in.");
      return false;
    }
    if (file.meta === undefined || file.meta.meetingminutes_id === undefined) {
      console.log(
        "Attachment download prohibited. File without parent meeting series.",
      );
      return false;
    }

    // see if user has the view role for this meeting series
    const ur = new UserRoles(this.userId);
    if (!ur.hasViewRoleFor(file.meta.parentseries_id)) {
      console.log(
        "Attachment download prohibited. User has no view role for meeting series: " +
          file.meta.parentseries_id,
      );
      return false;
    }

    return true; // OK - Download allowed
  },
});

extendedPublishSubscribeHandler.publishByMeetingSeriesOrMinute(
  "files.attachments.all",
  AttachmentsCollection,
  "meta.parentseries_id",
  "meta.meetingminutes_id",
);

Meteor.methods({
  // #Security: onBeforeRemove
  // Here we check for remove rights of user. User must have
  //   - either: moderator role for meeting series
  //   - or: uploader role for meeting series and this file was uploaded by user
  // This will be run in method server context.
  "attachments.remove"(attachmentID) {
    if (!(Meteor.isServer && attachmentID)) {
      return;
    }
    if (!this.userId) {
      console.log("Attachment removal prohibited. User not logged in.");
      return false;
    }
    const file = AttachmentsCollection.findOne(attachmentID);
    if (!file) {
      console.log("Attachment removal prohibited. Attachment not found in DB.");
      return false;
    }
    // we must ensure a known meeting minutes id, otherwise we can not check
    // sufficient user role afterwards
    if (file.meta === undefined || file.meta.meetingminutes_id === undefined) {
      console.log(
        "Attachment removal prohibited. File without meetingminutes_id.",
      );
      return false;
    }

    const att = new Attachment(attachmentID);
    // mayRemove() checks for not-finalized minutes and sufficient user role
    if (!att.mayRemove()) {
      console.log(
        "Attachment removal prohibited. User has no sufficient role for meeting series: " +
          file.meta.parentseries_id,
      );
      return false;
    }

    AttachmentsCollection.remove({ _id: attachmentID }, (error) => {
      if (error) {
        console.error(
          `File ${attachmentID} wasn't removed, error: ${error.reason}`,
        );
      } else {
        console.info(`File ${attachmentID} successfully removed`);
      }
    });
  },
});
