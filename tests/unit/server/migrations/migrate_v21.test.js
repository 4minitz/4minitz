
// TODO: This migrate_v2 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';


const MeetingSeriesSchema = {};

const TopicSchema = {
};
TopicSchema.getCollection = _ => TopicSchema;

const MinutesFinder = {};
const TopicsFinder = {};


const {
        MigrateV21
    } = proxyquire('../../../../server/migrations/migrate_v21', {
    '../../imports/services/minutesFinder': { MinutesFinder, '@noCallThru': true},
    '../../imports/services/topicsFinder': { TopicsFinder, '@noCallThru': true},
    '/imports/collections/meetingseries.schema': { MeetingSeriesSchema, '@noCallThru': true},
    '/imports/collections/topic.schema': { TopicSchema, '@noCallThru': true},
    });
