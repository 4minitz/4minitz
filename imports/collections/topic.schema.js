import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { InfoItemSchema } from './infoitem.schema';

export const TopicSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    subject: {type: String},
    responsible: {type: String, defaultValue: '', optional: true},
    responsibles: {type: [String], defaultValue: [], optional: true},
    isOpen: {type: Boolean, defaultValue: true},
    isNew: {type: Boolean, defaultValue: true},
    infoItems: {type: [InfoItemSchema], defaultValue: []}
});

