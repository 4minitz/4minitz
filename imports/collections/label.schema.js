import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import './idValidator';

export const LabelSchema = SchemaClass.create({
    name: 'LabelSchema',
    fields: {
        _id: {type: String, validators: [{type: 'meteorId'}]},
        isDefaultLabel: {type: Boolean, default: false},
        isDisabled: {type: Boolean, default: false},
        name: {type: String},
        color: {type: String, default: '#e6e6e6'}
    }
})


// simple schema, deprecated, will soon be removed

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const SimpleLabelSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    isDefaultLabel: {type: Boolean, defaultValue: false},
    isDisabled: {type: Boolean, defaultValue: false},
    name: {type: String},
    color: {type: String, defaultValue: '#e6e6e6'}
});