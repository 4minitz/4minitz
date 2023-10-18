import "./helpers/promisedMethods";
import "./collections/meetingseries_private";

import { formatDateISO8601 } from "/imports/helpers/date";
import { subElementsHelper } from "/imports/helpers/subElements";
import { MinutesFinder } from "/imports/services/minutesFinder";
import { _ } from "lodash";
import { $ } from "meteor/jquery";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import moment from "moment/moment";

import { MeetingSeriesSchema } from "./collections/meetingseries.schema";
import { Minutes } from "./minutes";
import { TopicsFinder } from "./services/topicsFinder";
import { UserRoles } from "./userroles";

export class MeetingSeries {
  constructor(source) {
    // constructs obj from Mongo ID or Mongo document
    if (!source) return;

    if (typeof source === "string") {
      // we may have an ID here.
      source = MeetingSeriesSchema.getCollection().findOne(source);
    }
    if (typeof source === "object") {
      // inject class methods in plain collection document
      _.extend(this, source);
    }
  }

  // ################### static methods
  static find(...args) {
    return MeetingSeriesSchema.getCollection().find(...args);
  }

  static findOne(...args) {
    return MeetingSeriesSchema.getCollection().findOne(...args);
  }

  static async remove(meetingSeries) {
    return Meteor.callPromise(
      "workflow.removeMeetingSeries",
      meetingSeries._id,
    );
  }

  static async leave(meetingSeries) {
    return Meteor.callPromise("workflow.leaveMeetingSeries", meetingSeries._id);
  }

  static getAllVisibleIDsForUser(userId) {
    // we return an array with just a list of visible meeting series IDs
    return MeetingSeriesSchema.find(
      { visibleFor: { $in: [userId] } },
      { _id: 1 },
    ).map((item) => item._id);
  }

  // ################### object methods

  getRecord() {
    return MeetingSeriesSchema.findOne(this._id);
  }

  async removeMinutesWithId(minutesId) {
    console.log(`removeMinutesWithId: ${minutesId}`);

    await Minutes.remove(minutesId);
    return this.updateLastMinutesFieldsAsync();
  }

  save(optimisticUICallback) {
    return this._id
      ? Meteor.callPromise("meetingseries.update", this)
      : Meteor.callPromise("meetingseries.insert", this, optimisticUICallback);
  }

  async saveAsync(optimisticUICallback) {
    await this.save(optimisticUICallback);
  }

  toString() {
    return `MeetingSeries: ${JSON.stringify(this, null, 4)}`;
  }

  log() {
    console.log(this.toString());
  }

  addNewMinutes(optimisticUICallback, serverCallback) {
    console.log("addNewMinutes()");

    // The new Minutes object should be dated after the latest existing one
    let newMinutesDate = new Date();
    const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);
    if (lastMinutes && formatDateISO8601(newMinutesDate) <= lastMinutes.date) {
      const lastMinDate = moment(lastMinutes.date);
      newMinutesDate = lastMinDate.add(1, "days").toDate();
    }
    // Transfer global note from last minutes if set sticky
    const globalNotePinned = lastMinutes?.globalNotePinned;
    const globalNote = globalNotePinned ? lastMinutes.globalNote : "";

    const min = new Minutes({
      meetingSeries_id: this._id,
      date: formatDateISO8601(newMinutesDate),
      visibleFor: this.visibleFor, // freshly created minutes inherit
      // visibility of their series
      informedUsers: this.informedUsers, // freshly created minutes inherit
      // informedUsers of their series
      globalNotePinned,
      globalNote,
    });

    min.generateNewParticipants();
    min.save(optimisticUICallback, serverCallback);
  }

  upsertTopic() {
    // TODO: refactor topic class and make this method obsolete
  }

  hasMinute(id) {
    for (const minuteId of this.minutes) {
      if (minuteId === id) {
        return true;
      }
    }
  }

  countMinutes() {
    return this.minutes ? this.minutes.length : 0;
  }

  async updateLastMinutesFields(callback) {
    callback = callback || (() => {});

    try {
      const result = await this.updateLastMinutesFieldsAsync();
      callback(undefined, result);
    } catch (error) {
      callback(error);
    }
  }

  async updateLastMinutesFieldsAsync(lastMinuteDoc) {
    const updateInfo = {
      _id: this._id,
    };

    const lastMinutes = lastMinuteDoc
      ? lastMinuteDoc
      : MinutesFinder.lastMinutesOfMeetingSeries(this);

    updateInfo.lastMinutesDate = lastMinutes ? lastMinutes.date : "";
    updateInfo.lastMinutesId = lastMinutes ? lastMinutes._id : null;
    updateInfo.lastMinutesFinalized = lastMinutes
      ? lastMinutes.isFinalized
      : false;

    return Meteor.callPromise("meetingseries.update", updateInfo);
  }

  addNewMinutesAllowed() {
    const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);
    return !lastMinutes || lastMinutes.isFinalized;
  }

  _getDateOfLatestMinute() {
    const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);

    if (lastMinutes) {
      return new Date(lastMinutes.date);
    }
  }

  _getDateOfLatestMinuteExcluding(minuteId) {
    // TODO check if excluding the given minuteId could be
    // done directly in the find call on the collection

    const latestMinutes = Minutes.findAllIn(this.minutes, 2).map((minute) => {
      return {
        _id: minute._id,
        date: minute.date,
      };
    });

    if (!latestMinutes) {
      return;
    }

    const firstNonMatchingMinute = latestMinutes.find(
      (minute) => minute._id !== minuteId,
    );
    if (firstNonMatchingMinute) {
      return new Date(firstNonMatchingMinute.date);
    }
  }

  /**
   * Gets the first possible date which can be assigned
   * to the given minutes.
   *
   * @param minutesId
   * @returns Date or false, if all dates are possible.
   */
  getMinimumAllowedDateForMinutes(minutesId) {
    const firstPossibleDate = minutesId
      ? this._getDateOfLatestMinuteExcluding(minutesId)
      : this._getDateOfLatestMinute();

    if (firstPossibleDate) {
      firstPossibleDate.setHours(0);
      firstPossibleDate.setMinutes(0);
    }

    return firstPossibleDate;
  }

  isMinutesDateAllowed(minutesId, date) {
    if (typeof date === "string") {
      date = new Date(date);
    }

    date.setHours(0);
    date.setMinutes(0);

    const firstPossibleDate = this.getMinimumAllowedDateForMinutes(minutesId);
    // if no firstPossibleDate is given, all dates are allowed
    return !firstPossibleDate || date > firstPossibleDate;
  }

  /**
   * Overwrite the current "visibleFor" array with new user Ids
   * Needs a "save()" afterwards to persist
   * @param {Array} newVisibleForArray
   * @param {Array} newInformedUsersArray
   */
  setVisibleAndInformedUsers(newVisibleForArray, newInformedUsersArray) {
    if (!this._id) {
      throw new Meteor.Error(
        "MeetingSeries not saved.",
        "Call save() before using addVisibleUser()",
      );
    }
    if (!$.isArray(newVisibleForArray)) {
      throw new Meteor.Error("setVisibleUsers()", "must provide an array!");
    }

    // Clean-up roles
    // Collect all removed users where the meeting series is not visible and not
    // informed anymore And then remove the old meeting series role from these
    // users
    let oldUserArray = this.visibleFor;
    if (this.informedUsers) {
      oldUserArray = oldUserArray.concat(this.informedUsers);
    }
    let newUserArray = newVisibleForArray;
    newUserArray = newUserArray.concat(newInformedUsersArray);

    const removedUserIDs = oldUserArray.filter((usrID) => {
      return newUserArray.indexOf(usrID) === -1;
    });
    removedUserIDs.forEach((removedUserID) => {
      const ur = new UserRoles(removedUserID);
      ur.removeAllRolesForMeetingSeries(this._id);
    });

    // persist new user arrays to meeting series
    this.informedUsers = newInformedUsersArray;
    this.visibleFor = newVisibleForArray;

    // sync visibility for *all* minutes (to allow publish & subscribe)
    Minutes.syncVisibility(this._id, this.visibleFor);

    // sync informed only to *not finalized* minutes (do not change the past!)
    const lastMinutes = MinutesFinder.lastMinutesOfMeetingSeries(this);
    if (lastMinutes && !lastMinutes.isFinalized) {
      lastMinutes.informedUsers = newInformedUsersArray;
      lastMinutes.save();
    }
  }

  isCurrentUserModerator() {
    const ur = new UserRoles();
    return ur.isModeratorOf(this._id);
  }

  findLabel(id) {
    return subElementsHelper.getElementById(id, this.availableLabels);
  }

  findLabelByName(labelName) {
    return subElementsHelper.getElementById(
      labelName,
      this.availableLabels,
      "name",
    );
  }

  findLabelContainingSubstr(name, caseSensitive = true) {
    return this.availableLabels.filter((label) => {
      const left = caseSensitive ? label.name : label.name.toUpperCase();
      const right = caseSensitive ? name : name.toUpperCase();
      return left.indexOf(right) !== -1;
    });
  }

  removeLabel(id) {
    const index = subElementsHelper.findIndexById(
      id,
      this.getAvailableLabels(),
    );
    if (undefined === index) {
      return;
    }

    this.availableLabels.splice(index, 1);
  }

  upsertLabel(labelDoc) {
    let i = undefined;
    if (labelDoc._id) {
      i = subElementsHelper.findIndexById(labelDoc._id, this.availableLabels); // try to find it
    } else {
      // brand-new label
      labelDoc._id = Random.id();
    }

    if (i === undefined) {
      // label not in array
      this.availableLabels.unshift(labelDoc);
    } else {
      this.availableLabels[i] = labelDoc; // overwrite in place
    }
  }

  getAvailableLabels() {
    if (this.availableLabels) {
      return this.availableLabels;
    }
    return [];
  }

  /**
   * Add a new (free-text) responsible to the meeting series.
   * New entry will be pushed to front, existing double will be removed
   * Needs a "save()" afterwards to persist
   * @param {String} newResponsible
   */
  addAdditionalResponsible(newResponsible) {
    // remove newResponsible if already present
    const index = this.additionalResponsibles.indexOf(newResponsible);
    if (index !== -1) {
      this.additionalResponsibles.splice(index, 1);
    }

    // put newResponsible to front of array
    this.additionalResponsibles.unshift(newResponsible);
  }

  findTopic(topicId) {
    return TopicsFinder.getTopicById(topicId, this._id);
  }
}
