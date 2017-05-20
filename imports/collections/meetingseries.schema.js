import { Class as SchemaClass } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';

import { TopicSchema, SimpleTopicSchema } from './topic.schema';
import { LabelSchema, SimpleLabelSchema } from './label.schema';
import { MeetingSeries } from '../meetingseries';
import './idValidator';

export let MeetingSeriesCollection = new Mongo.Collection('meetingSeries', {
    transform: function (doc) {
        return new MeetingSeries(doc);
    }
});

export const MeetingSeriesSchema = SchemaClass.create({
    name: 'MeetingSeriesSchema',
    collection: MeetingSeriesCollection,
    fields: {
        project: {type: String},
        name: {type: String},
        createdAt: {type: Date},
        visibleFor: {type: [String], validators: [{type: 'meteorId'}]},
        informedUsers: {type: [String], optional: true}, // element may be userID or EMail address
        // todo: make this a date?
        lastMinutesDate: {type: String},
        minutes: {type: [String], default: []},
        openTopics: {type: [TopicSchema], default: []},
        topics: {type: [TopicSchema], default: []},
        availableLabels: {type: [LabelSchema], default: []},
        additionalResponsibles: {type: [String], default: []}
    }
});

// simple schema, deprecated, will be removed soon

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const SimpleMeetingSeriesSchema = new SimpleSchema({
    project: {type: String},
    name: {type: String},
    createdAt: {type: Date},
    visibleFor: {type: [String], regEx: SimpleSchema.RegEx.Id},
    informedUsers: {type: [String], optional: true}, // element may be userID or EMail address
    // todo: make this a date?
    lastMinutesDate: {type: String},
    minutes: {type: [String], defaultValue: []},
    openTopics: {type: [SimpleTopicSchema], defaultValue: []},
    topics: {type: [SimpleTopicSchema], defaultValue: []},
    availableLabels: {type: [SimpleLabelSchema], defaultValue: []},
    additionalResponsibles: {type: [String], defaultValue: []}
});
