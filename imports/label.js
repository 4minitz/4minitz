import { Meteor } from "meteor/meteor";
import { _ } from "meteor/underscore";
import { MeetingSeries } from "./meetingseries";
import { ColorHelper } from "./ColorHelper";

export class Label {
  constructor(source) {
    if (!source) {
      throw new Meteor.Error(
        "It is not allowed to create a Label without the source",
      );
    }

    _.defaults(source, {
      isDefaultLabel: false,
      isDisabled: false,
      color: "#e6e6e6",
    });

    let nameAndColor = Label._separateNameAndColor(source.name);
    if (typeof nameAndColor !== "string") {
      source.name = nameAndColor.name;
      source.color = nameAndColor.color;
    }

    this._labelDoc = source;

    this._checkLabelColor();
  }

  static _separateNameAndColor(nameAndColorStr) {
    let nameAndColor = nameAndColorStr.match(
      /(.*)(#([a-f\d][a-f\d][a-f\d]){1,2})$/,
    );
    if (nameAndColor && nameAndColor.length > 2) {
      return {
        name: nameAndColor[1],
        color: nameAndColor[2],
      };
    }

    return nameAndColorStr;
  }

  static createLabelById(parentMeetingSeries, labelId) {
    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    let labelDoc = parentMeetingSeries.findLabel(labelId);
    if (labelDoc) return new Label(labelDoc);
    return null;
  }

  static createLabelByName(parentMeetingSeries, labelName) {
    let nameAndColor = Label._separateNameAndColor(labelName);
    if (typeof nameAndColor !== "string") {
      labelName = nameAndColor.name;
    }

    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    let labelDoc = parentMeetingSeries.findLabelByName(labelName);
    if (labelDoc) return new Label(labelDoc);
    return null;
  }

  static findLabelsContainingSubstring(
    parentMeetingSeries,
    name,
    caseSensitive,
  ) {
    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    let labelDoc = parentMeetingSeries.findLabelContainingSubstr(
      name,
      caseSensitive,
    );
    if (labelDoc) return labelDoc;
    return null;
  }

  static _createParentMeetingSeries(parentMeetingSeries) {
    if (typeof parentMeetingSeries === "string") {
      return new MeetingSeries(parentMeetingSeries);
    } else if (
      Object.prototype.hasOwnProperty.call(parentMeetingSeries, "findLabel")
    ) {
      return parentMeetingSeries;
    }

    throw new Meteor.Error("Invalid parent meeting series");
  }

  getId() {
    return this._labelDoc._id;
  }

  setName(name) {
    this._labelDoc.name = name;
  }

  getName() {
    return this._labelDoc.name;
  }

  getColor() {
    return this._labelDoc.color;
  }

  setColor(color) {
    this._labelDoc.color = color;
  }

  hasDarkBackground() {
    return ColorHelper.isDarkColor(this.getColor());
  }

  getDocument() {
    return this._labelDoc;
  }

  save(parentMeetingSeries) {
    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    parentMeetingSeries.upsertLabel(this._labelDoc);
    parentMeetingSeries.save();
  }

  _checkLabelColor() {
    if (!ColorHelper.isValidHexColorString(this.getColor())) {
      throw new Meteor.Error(
        "invalid-color",
        "Label color must be a valid hex code",
      );
    }
  }
}
