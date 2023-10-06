import { Meteor } from 'meteor/meteor';

Meteor.callPromise = function (method, ...args) {
    return new Promise(function (resolve, reject) {
        Meteor.call(method, ...args, (error, result) => {
            if (error) {
                reject(error);
            }

            resolve(result);
        });
    });
};
