import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';

import { TopicSchema, SimpleTopicSchema } from './topic.schema';
import { Minutes } from '../minutes';
import './idValidator';

export let MinutesCollection = new Mongo.Collection('minutes', {
    transform: function (doc) {
        return new Minutes(doc);
    }
});

const ParticipantsSchema = SchemaClass.create({
    name: 'ParticipantsSchema',
    fields: {
        userId: {type: String, validators: [{type: 'meteorId'}]},
        present: {type: Boolean, default: false},
        minuteKeeper: {type: Boolean, default: false}
    }
});

export const MinutesSchema = SchemaClass.create({
    name: 'MinutesSchema',
    collection: MinutesCollection,
    fields: {
        meetingSeries_id: {type: String, validators: [{type: 'meteorId'}]},
        // todo: make this of type date
        date: {type: String},
        globalNote: {type: String, default: '', optional: true},
        topics: {type: [TopicSchema], default: []},
        createdAt: {type: Date},
        agendaSentAt: {type: Date, optional: true},
        // array of user IDs
        visibleFor: {type: [String], validators: [{type: 'meteorId'}]},
        // array of user IDs
        informedUsers: {type: [String], validators: [{type: 'meteorId'}], default: []},
        participants: {type: [ParticipantsSchema], default: []},
        participantsAdditional: {type: String, default: '', optional: true},
        isFinalized: {type: Boolean, default: false},
        finalizedAt: {type: Date, optional: true},
        finalizedBy: {type: String, optional: true},
        finalizedVersion: {type: Number, optional: true, default: 0},
        finalizedHistory: {type: [String], optional: true, default: []}
    }
});


// simple schema

// see also schema migration class MigrateV2
const SimpleParticipantsSchema = new SimpleSchema({
    userId: {type: String, regEx: SimpleSchema.RegEx.Id},
    present: {type: Boolean, defaultValue: false},
    minuteKeeper: {type: Boolean, defaultValue: false}
});



export const SimpleMinutesSchema = new SimpleSchema({
    meetingSeries_id: {type: String, regEx: SimpleSchema.RegEx.Id},
    // todo: make this of type date
    date: {type: String},
    globalNote: {type: String, defaultValue: '', optional: true},
    topics: {type: [SimpleTopicSchema], defaultValue: []},
    createdAt: {type: Date},
    agendaSentAt: {type: Date, optional: true},
    visibleFor: {type: [String], regEx: SimpleSchema.RegEx.Id},                        // array of user IDs
    informedUsers: {type: [String], regEx: SimpleSchema.RegEx.Id, defaultValue: []},   // array of user IDs
    participants: {type: [SimpleParticipantsSchema], defaultValue: []},
    participantsAdditional: {type: String, defaultValue: '', optional: true},
    isFinalized: {type: Boolean, defaultValue: false},
    finalizedAt: {type: Date, optional: true},
    finalizedBy: {type: String, optional: true},
    finalizedVersion: {type: Number, optional: true, defaultValue: 0},
    finalizedHistory: {type: [String], optional: true, defaultValue: []}
});

