/**
 * Created by felix on 11.05.16.
 */
import { SimpleSchema } from 'meteor/aldeed:simple-schema';


export const InfoItemSchema = new SimpleSchema({
    _id: {type: String, regEx: SimpleSchema.RegEx.Id},
    subject: {type: String},
    isOpen: {type: Boolean, optional: true}
});