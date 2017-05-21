
// TODO: This migrate_v4 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';

require('../../../../imports/helpers/date');

let MinutesSchema = {};

let MeetingSeriesSchema = {};

const {
        MigrateV4
    } = proxyquire('../../../../server/migrations/migrate_v4', {
        '/imports/collections/minutes.schema': { MinutesSchema, '@noCallThru': true},
        '/imports/collections/meetingseries.schema': { MeetingSeriesSchema, '@noCallThru': true}
    });
