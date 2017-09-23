import { expect } from 'chai';
import proxyquire from 'proxyquire';

let Meteor = {};

let MeetingSeriesSchema = {};

let TopicSchema = {};

const {
    MigrateV19
} = proxyquire('../../../../server/migrations/migrate_v19', {
    'meteor/meteor': { Meteor, '@noCallThru': true},
    '/imports/collections/meetingseries.schema': { MeetingSeriesSchema, '@noCallThru': true},
    '/imports/collections/topic.schema': { TopicSchema, '@noCallThru': true},
});
