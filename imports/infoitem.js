/**
 * A InfoItem is a sub-element of
 * a topic which has a subject,
 * a date when is was created
 * and a list of associated tags.
 */
import { Meteor } from "meteor/meteor";
import { _ } from "meteor/underscore";
import { formatDateISO8601 } from "/imports/helpers/date";
import { Random } from "meteor/random";
import { User } from "/imports/user";
export class InfoItem {
  constructor(parentTopic, source) {
    if (!parentTopic || !source)
      throw new Meteor.Error(
        "It is not allowed to create a InfoItem without the parentTopicId and the source",
      );

    this._parentTopic = undefined;
    this._infoItemDoc = undefined;

    if (typeof parentTopic === "object") {
      // we have a topic object here.
      this._parentTopic = parentTopic;
    }
    if (!this._parentTopic) {
      throw new Meteor.Error("No parent Topic given!");
    }

    if (typeof source === "string") {
      // we may have an ID here.
      // Caution: findInfoItem returns a InfoItem-Object not the document itself!
      let infoItem = this._parentTopic.findInfoItem(source);
      source = infoItem._infoItemDoc;
    }

    if (!Object.prototype.hasOwnProperty.call(source, "createdInMinute")) {
      throw new Meteor.Error("Property createdInMinute of topicDoc required");
    }

    _.defaults(source, {
      itemType: "infoItem",
      isNew: true,
      isSticky: false,
      labels: [],
    });
    this._infoItemDoc = source;
  }

  // ################### static methods
  static isActionItem(infoItemDoc) {
    return infoItemDoc.itemType === "actionItem";
  }

  static isCreatedInMinutes(infoItemDoc, minutesId) {
    return infoItemDoc.createdInMinute === minutesId;
  }

  // ################### object methods
  invalidateIsNewFlag() {
    this._infoItemDoc.isNew = false;
  }

  getId() {
    return this._infoItemDoc._id;
  }

  isSticky() {
    return this._infoItemDoc.isSticky;
  }

  isDeleteAllowed(currentMinutesId) {
    return this._infoItemDoc.createdInMinute === currentMinutesId;
  }

  toggleSticky() {
    this._infoItemDoc.isSticky = !this.isSticky();
  }

  getSubject() {
    return this._infoItemDoc.subject;
  }

  addDetails(minuteId, text) {
    if (text === undefined) text = "";

    let date = formatDateISO8601(new Date());
    if (!this._infoItemDoc.details) {
      this._infoItemDoc.details = [];
    }
    this._infoItemDoc.details.push({
      _id: Random.id(),
      createdInMinute: minuteId,
      createdAt: new Date(),
      createdBy: User.PROFILENAMEWITHFALLBACK(Meteor.user()),
      updatedAt: new Date(),
      updatedBy: User.PROFILENAMEWITHFALLBACK(Meteor.user()),
      date: date,
      text: text,
      isNew: true,
    });
  }

  removeDetails(index) {
    this._infoItemDoc.details.splice(index, 1);
  }

  updateDetails(index, text) {
    if (text === "") {
      throw new Meteor.Error(
        "invalid-argument",
        "Empty details are not allowed. Use #removeDetails() " +
          "to delete an element",
      );
    }
    if (text !== this._infoItemDoc.details[index].text) {
      this._infoItemDoc.details[index].date = formatDateISO8601(new Date());
      this._infoItemDoc.details[index].text = text;
      this._infoItemDoc.details[index].updatedAt = new Date();
      this._infoItemDoc.details[index].updatedBy = User.PROFILENAMEWITHFALLBACK(
        Meteor.user(),
      );
    }
  }

  getDetails() {
    if (!this._infoItemDoc.details) {
      this._infoItemDoc.details = [];
    }

    return this._infoItemDoc.details;
  }

  getDetailsAt(index) {
    if (
      !this._infoItemDoc.details ||
      index < 0 ||
      index >= this._infoItemDoc.details.length
    ) {
      throw new Meteor.Error("index-out-of-bounds");
    }

    return this._infoItemDoc.details[index];
  }

  async save(callback) {
    callback = callback || function () {};

    try {
      let result = await this.saveAsync();
      callback(undefined, result);
    } catch (error) {
      callback(error);
    }
  }

  async saveAsync(insertPlacementTop = true) {
    // caution: this will update the entire topics array from
    // the parent minutes of the parent topic!
    if (!this._infoItemDoc._id) {
      // it is a new one
      this._infoItemDoc.createdAt = new Date();
      this._infoItemDoc.createdBy = User.PROFILENAMEWITHFALLBACK(Meteor.user());
    }
    this._infoItemDoc.updatedAt = new Date();
    this._infoItemDoc.updatedBy = User.PROFILENAMEWITHFALLBACK(Meteor.user());
    this._infoItemDoc._id = await this._parentTopic.upsertInfoItem(
      this._infoItemDoc,
      true,
      insertPlacementTop,
    );
  }

  async saveAtBottom() {
    return this.saveAsync(false);
  }

  getParentTopic() {
    return this._parentTopic;
  }

  isActionItem() {
    return InfoItem.isActionItem(this._infoItemDoc);
  }

  getDocument() {
    return this._infoItemDoc;
  }

  setSubject(newSubject) {
    this._infoItemDoc.subject = newSubject;
  }

  /**
   *
   * @param labelIds {string[]}
   */
  addLabelsById(labelIds) {
    labelIds.forEach((id) => {
      if (!this.hasLabelWithId(id)) {
        this._infoItemDoc.labels.push(id);
      }
    });
  }

  hasLabelWithId(labelId) {
    let i;
    for (i = 0; i < this._infoItemDoc.labels.length; i++) {
      if (this._infoItemDoc.labels[i] === labelId) {
        return true;
      }
    }
    return false;
  }

  getLabelsRawArray() {
    if (!this._infoItemDoc.labels) {
      return [];
    }
    return this._infoItemDoc.labels;
  }

  toString() {
    return "InfoItem: " + JSON.stringify(this._infoItemDoc, null, 4);
  }

  log() {
    console.log(this.toString());
  }
}
