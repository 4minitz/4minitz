import {_} from "lodash";

import {AttachmentsCollection} from "./collections/attachments_private";
import {Minutes} from "./minutes";
import {UserRoles} from "./userroles";

export class Attachment {
  constructor(attachmentID) {
    this._roles = new UserRoles(this.userId);
    if (!this._roles) {
      console.log("Could not retrieve roles for ", this.userId);
    }
    this._file = AttachmentsCollection.findOne(attachmentID);
    if (!this._file) {
      throw new Error(
          `Attachment(): Could not retrieve attachment for ID ${attachmentID}`,
      );
    }
  }

  // ********** static methods ****************
  static findForMinutes(minID) {
    return AttachmentsCollection.find({"meta.meetingminutes_id" : minID});
  }

  static countAll() { return AttachmentsCollection.find().count(); }

  static countForMinutes(minID) {
    return Attachment.findForMinutes(minID).count();
  }

  static countAllBytes() {
    const atts = AttachmentsCollection.find({}, {size : 1});
    let sumBytes = 0;
    atts.forEach((att) => { sumBytes += att.size; });
    return sumBytes;
  }

  static uploadFile(uploadFilename, minutesObj, callbacks = {}) {
    const doNothing = () => {};
    callbacks = _.extend(
        {
          onStart : doNothing,
          onEnd : doNothing,
          onAbort : doNothing,
        },
        callbacks,
    );

    const upload = AttachmentsCollection.insert(
        {
          file : uploadFilename,
          streams : "dynamic",
          chunkSize : "dynamic",
          meta : {
            meetingminutes_id : minutesObj._id,
            parentseries_id : minutesObj.parentMeetingSeriesID(),
          },
        },
        false,
    );

    upload.on("start", function() {
      callbacks.onStart(this); // this == current upload object
    });
    upload.on("end", (error, fileObj) => { callbacks.onEnd(error, fileObj); });
    upload.on("abort",
              (error, fileObj) => { callbacks.onAbort(error, fileObj); });

    upload.start();
  }

  // ********** object methods ****************
  isUploaderAndFileOwner() {
    return (this._roles.isUploaderFor(this._file.meta.parentseries_id) &&
            this._roles.getUserID() === this._file.userId);
  }

  isModerator() {
    return this._roles.isModeratorOf(this._file.meta.parentseries_id);
  }

  /**
   * Checks if:
   * - meeting is not finalized and
   * - user is either (moderator) or (uploader & file owner)
   * @returns {boolean}
   */
  mayRemove() {
    const min = new Minutes(this._file.meta.meetingminutes_id);
    if (min.isFinalized) {
      return false;
    }
    return this.isUploaderAndFileOwner() || this.isModerator();
  }
}
