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
    isOpen: {type: Boolean, optional: true},                            // action item
    isNew: {type: Boolean, optional: true},                             // action item
    responsible: {type: String, defaultValue: '', optional: true},      // action item
    priority: {type: String, defaultValue: '', optional: true},         // action item
    duedate: {type: String, optional: true},                            // action item
    details: {type: [DetailsSchema], defaultValue: [], optional: true}  // action item
});