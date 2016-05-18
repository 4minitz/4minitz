/**
 * Created by felix on 11.05.16.
 */
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const DetailsSchema = new SimpleSchema({
    date: {type: String},
    text: {type: String, defaultValue: '', optional: true}
});

export const InfoItemSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    subject: {type: String},
    isOpen: {type: Boolean, optional: true},
    responsible: {type: String, defaultValue: '', optional: true},
    priority: {type: String, defaultValue: '', optional: true},
    duedate: {type: String, optional: true},
    details: {type: [DetailsSchema], defaultValue: [], optional: true}
});