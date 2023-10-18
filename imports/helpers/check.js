import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";

export const checkWithMsg = (variable, pattern, message) => {
  try {
    check(variable, pattern);
  } catch (err) {
    if (message) {
      throw new Meteor.Error("Parameter check failed.", message);
    }
    throw err;
  }
};

export const instanceCheck = (variable, type) => {
  const isValidSeries = variable instanceof type;

  if (!isValidSeries) {
    throw new Meteor.Error("invalid-type", `Not a valid ${typeof type}`);
  }
};
