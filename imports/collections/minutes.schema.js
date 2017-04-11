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
    globalNote: {type: String, defaultValue: "", optional: true},
    topics: {type: [TopicSchema], defaultValue: []},
    createdAt: {type: Date},
    agendaSentAt: {type: Date, optional: true},
    visibleFor: {type: [String], regEx: SimpleSchema.RegEx.Id},                        // array of user IDs
    informedUsers: {type: [String], regEx: SimpleSchema.RegEx.Id, defaultValue: []},   // array of user IDs
    participants: {type: [ParticipantsSchema], defaultValue: []},
    participantsAdditional: {type: String, defaultValue: "", optional: true},
    isFinalized: {type: Boolean, defaultValue: false},
    finalizedAt: {type: Date, optional: true},
    finalizedBy: {type: String, optional: true},
    finalizedVersion: {type: Number, optional: true, defaultValue: 0},
    finalizedHistory: {type: [String], optional: true, defaultValue: []}
});

