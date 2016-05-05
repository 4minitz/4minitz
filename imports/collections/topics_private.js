import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const DetailsSchema = new SimpleSchema({
    date: {type: String},
    text: {type: String, defaultValue: '', optional: true}
});

export const TopicSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    subject: {type: String},
    responsible: {type: String, defaultValue: '', optional: true},
    priority: {type: String, defaultValue: '', optional: true},
    duedate: {type: String},
    details: {type: [DetailsSchema], defaultValue: []},
    isOpen: {type: Boolean, defaultValue: true},
    isNew: {type: Boolean, defaultValue: true}
});

