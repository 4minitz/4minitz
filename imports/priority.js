import { i18n } from "meteor/universe:i18n";

const assert = require("assert");

// #I18N - Attention: the below strings with longer texts will be never be used in UI!
// Instead they will be pulled from translation language files via toString() method below
const PRIORITY_MAP = {
  1: "1 - High",
  2: "2",
  3: "3 - Medium",
  4: "4",
  5: "5 - Low",
};

export class Priority {
  static GET_DEFAULT_PRIORITY() {
    return new Priority(3);
  }

  static GET_PRIORITIES() {
    return Object.keys(PRIORITY_MAP).map((value) => new Priority(value));
  }

  static extractPriorityFromString(string) {
    const regEx = /prio:([1-5])/g;
    let match = regEx.exec(string);
    if (match !== null) {
      return new Priority(match[1]);
    }
    return false;
  }

  constructor(value) {
    assert(value >= 1 && value < 6, `invalid priority value: ${value}`);
    this.value = parseInt(value, 10);
  }

  toString() {
    if (Object.prototype.hasOwnProperty.call(PRIORITY_MAP, this.value)) {
      switch (this.value) {
        case 1:
          return i18n.__("Item.Priorities.high");
        case 3:
          return i18n.__("Item.Priorities.medium");
        case 5:
          return i18n.__("Item.Priorities.low");
      }
      return PRIORITY_MAP[this.value];
    }
    throw new Error(`illegal-state: Unknown priority ${this.value}`);
  }
}
