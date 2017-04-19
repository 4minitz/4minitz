import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const BroadcastMessageSchema = new SimpleSchema({
    text: {type: String},
    isActive: {type: Boolean},
    createdAt: {type: Date},
    dismissForUserIDs: {type: [String], regEx: SimpleSchema.RegEx.Id},
});
