import { Class as SchemaClass } from 'meteor/jagi:astronomy';

import './idValidator';

const DetailsSchema = SchemaClass.create({
    name: 'DetailsSchema',
    fields: {
        _id: {type: String, validators: [{type: 'meteorId'}]},
        createdInMinute: {type: String, validators: [{type: 'meteorId'}]},
        date: String,
        text: {type: String, defaultValue: '', optional: true}
    }
});

export const InfoItemSchema = SchemaClass.create({
    name: 'InfoItemSchema',
    fields: {
        _id: {type: String, validators: [{type: 'meteorId'}]},
        itemType: {type: String, regEx: /^(actionItem)|(infoItem)$/, defaultValue: 'infoItem'},
        isSticky: {type: Boolean, defaultValue: false},
        createdInMinute: {type: String, validators: [{type: 'meteorId'}]},
        labels: {type: [String], validators: [{type: 'meteorId'}]},
        subject: {type: String},
        isOpen: {type: Boolean, optional: true},                            // action item
        isNew: {type: Boolean, optional: true},                             // action item
        responsibles: {type: [String], defaultValue: [], optional: true},   // action item
        priority: {type: String, defaultValue: '', optional: true},         // action item
        duedate: {type: String, optional: true},                            // action item
        details: {type: [DetailsSchema], defaultValue: [], optional: true}  // action item
    }
});


// simple-schema, still required for topics simple schema which is still used by the meeting series schema
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const SimpleDetailsSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    createdInMinute: {type: String, regEx: SimpleSchema.RegEx.Id},
    date: {type: String},
    text: {type: String, defaultValue: '', optional: true}
});

export const SimpleInfoItemSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    itemType: {type: String, regEx: /^(actionItem)|(infoItem)$/, defaultValue: 'infoItem'},
    isSticky: {type: Boolean, defaultValue: false},
    createdInMinute: {type: String, regEx: SimpleSchema.RegEx.Id},
    labels: {type: [String], regEx: SimpleSchema.RegEx.Id},
    subject: {type: String},
    isOpen: {type: Boolean, optional: true},                            // action item
    isNew: {type: Boolean, optional: true},                             // action item
    responsibles: {type: [String], defaultValue: [], optional: true},   // action item
    priority: {type: String, defaultValue: '', optional: true},         // action item
    duedate: {type: String, optional: true},                            // action item
    details: {type: [SimpleDetailsSchema], defaultValue: [], optional: true}  // action item
});