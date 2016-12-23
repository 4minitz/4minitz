import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const StatisticsRow = new SimpleSchema({
        description: {type: String},
        value: {type: String}
    });

export const StatisticsSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    result: {type: [StatisticsRow]},
});
