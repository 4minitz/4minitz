import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

export const checkWithMsg = (variable, pattern, message) => {
    try {
        check(variable, pattern);
    } catch (err) {
        if (message) {
            throw new Meteor.Error('Parameter check failed.', message);
        }
        throw err;
    }
};