import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { TopicSchema } from './topic.schema';

export const MinutesSchema = new SimpleSchema({
    meetingSeries_id: {type: String, regEx: SimpleSchema.RegEx.Id},
    // todo: make this of type date
    date: {type: String},
    topics: {type: [TopicSchema], defaultValue: []},
    createdAt: {type: Date},
    isFinalized: {type: Boolean, defaultValue: false},
    isUnfinalized: {type: Boolean, defaultValue: false},
    participants: {type: String, defaultValue: ""},
    agenda: {type: String, defaultValue: ""},
    finalizedAt: {type: Date, optional: true},
    finalizedBy: {type: String, optional: true},
    visibleFor: {type: [String], regEx: SimpleSchema.RegEx.Id}
});