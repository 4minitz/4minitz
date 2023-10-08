import { Meteor } from "meteor/meteor";

Meteor.callPromise = (method, ...args) =>
  new Promise((resolve, reject) => {
    Meteor.call(method, ...args, (error, result) => {
      if (error) {
        reject(error);
      }

      resolve(result);
    });
  });
