import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';

import './idValidator';
import { InfoItemSchema, SimpleInfoItemSchema } from './infoitem.schema';

export const TopicSchema = SchemaClass.create({
    name: 'TopicSchema',
    fields: {
        _id: {type: String, validators: [{type: 'meteorId'}]},
        createdInMinute: {type: String, validators: [{type: 'meteorId'}]},
        subject: {type: String},
        responsibles: {type: [String], defaultValue: [], optional: true},
        isOpen: {type: Boolean, defaultValue: true},
        isRecurring: {type: Boolean, defaultValue: false},
        isNew: {type: Boolean, defaultValue: true},
        infoItems: {type: [InfoItemSchema], defaultValue: []},
        labels: {type: [String], validators: [{type: 'meteorId'}]},
        isSkipped: {type: Boolean, defaultValue: false }
    }
});


// simple-schema, still required for topics simple schema which is still used by the meeting series schema

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const SimpleTopicSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    createdInMinute: {type: String, regEx: SimpleSchema.RegEx.Id},
    subject: {type: String},
    responsibles: {type: [String], defaultValue: [], optional: true},
    isOpen: {type: Boolean, defaultValue: true},
    isRecurring: {type: Boolean, defaultValue: false},
    isNew: {type: Boolean, defaultValue: true},
    infoItems: {type: [SimpleInfoItemSchema], defaultValue: []},
    labels: {type: [String], regEx: SimpleSchema.RegEx.Id},
    isSkipped: {type: Boolean, defaultValue: false }
});

