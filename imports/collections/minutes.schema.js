import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';

import { TopicSchema } from './topic.schema';
import { Minutes } from '../minutes';
import './idValidator';

let MinutesCollection = new Mongo.Collection('minutes', {
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
        createdBy: {type: String, optional: true},
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