import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const StatisticsSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    numberOfUsers: {type: Number},
    numberOfMeetingSeries: {type: Number},
    numberOfMinutes: {type: Number}
});