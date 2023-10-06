import { Meteor } from "meteor/meteor";

import { emailAddressRegExpTest } from "../helpers/email";
import { StringUtils } from "../helpers/string-utils";

export class ResponsibleExtractor {
  constructor(string, acceptOnlyValidEmailAsFreeText = false) {
    this.string = string;
    this.extractedResponsible = [];
    this.acceptOnlyValidEmailAsFreeText = acceptOnlyValidEmailAsFreeText;

    this._extractResponsible();
  }

  getExtractedResponsible() {
    return this.extractedResponsible;
  }

  getCleanedString() {
    return this.string;
  }

  _extractResponsible() {
    const regEx = new RegExp(/(^|[\s.,;])@([a-zA-Z]+[^\s,;]*)/g);
    const subjectString = this.string;
    let match;

    while ((match = regEx.exec(subjectString)) !== null) {
      const possibleResponsibleName = match[2];
      const added = this._addResponsible(possibleResponsibleName);
      if (added) {
        this._removeResponsibleFromString(possibleResponsibleName);
      }
    }
  }

  _addResponsible(responsibleName) {
    const user = Meteor.users.findOne({ username: responsibleName });
    if (user) {
      this.extractedResponsible.push(user._id);
      return true;
    }
    if (this._isValidResonsible(responsibleName)) {
      this.extractedResponsible.push(responsibleName);
      return true;
    }
    return false;
  }

  _isValidResonsible(possibleResponsibleName) {
    return (
      !this.acceptOnlyValidEmailAsFreeText ||
      emailAddressRegExpTest.test(possibleResponsibleName)
    );
  }

  _removeResponsibleFromString(responsibleName) {
    this.string = StringUtils.eraseSubstring(
      this.string,
      `@${responsibleName}`,
    );
  }
}
