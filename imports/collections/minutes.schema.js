import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { TopicSchema } from './topic.schema';

// see also schema migration class MigrateV2
export const ParticipantsSchema = new SimpleSchema({
    userId: {type: String, regEx: SimpleSchema.RegEx.Id},
    present: {type: Boolean, defaultValue: false},
    minuteKeeper: {type: Boolean, defaultValue: false}
});



export const MinutesSchema = new SimpleSchema({
    meetingSeries_id: {type: String, regEx: SimpleSchema.RegEx.Id},
    // todo: make this of type date
    date: {type: String},
    topics: {type: [TopicSchema], defaultValue: []},
    createdAt: {type: Date},
    isFinalized: {type: Boolean, defaultValue: false},
    isUnfinalized: {type: Boolean, defaultValue: false},
    participants: {type: [ParticipantsSchema], defaultValue: []},
    participantsAdditional: {type: String, defaultValue: "", optional: true},
    agenda: {type: String, defaultValue: ""},
    finalizedAt: {type: Date, optional: true},
    finalizedBy: {type: String, optional: true},
    visibleFor: {type: [String], regEx: SimpleSchema.RegEx.Id}
});

