import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { TopicSchema } from './topic.schema';

export const MeetingSeriesSchema = new SimpleSchema({
    project: {type: String},
    name: {type: String},
    createdAt: {type: Date},
    visibleFor: {type: [String], regEx: SimpleSchema.RegEx.Id},
    // todo: make this a date?
    lastMinutesDate: {type: String},
    minutes: {type: [String], defaultValue: []},
    openTopics: {type: [TopicSchema], defaultValue: []},
    topics: {type: [TopicSchema], defaultValue: []}
});
