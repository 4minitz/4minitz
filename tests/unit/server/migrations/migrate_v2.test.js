
// TODO: This migrate_v2 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

require('../../../../imports/helpers/date');

let MinutesSchema = {};

let MeetingSeriesSchema = {};

const {
        MigrateV2
    } = proxyquire('../../../../server/migrations/migrate_v2', {
        '/imports/collections/minutes.schema': { MinutesSchema, '@noCallThru': true},
        '/imports/collections/meetingseries.schema': { MeetingSeriesSchema, '@noCallThru': true}
    });
