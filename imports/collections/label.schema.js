import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const LabelSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    isDefaultLabel: {type: Boolean, defaultValue: false},
    isDisabled: {type: Boolean, defaultValue: false},
    name: {type: String},
    color: {type: String, defaultValue: '#e6e6e6'}
});