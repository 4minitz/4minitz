
// TODO: This migrate_v7 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';

require('../../../../imports/helpers/date');

let MinutesSchema = {};

let MeetingSeriesSchema = {};

let GlobalSettings = {};

const Random = {id: () => {}};

const {
        MigrateV7
    } = proxyquire('../../../../server/migrations/migrate_v7', {
        'meteor/random': { Random, '@noCallThru': true},
        '/imports/collections/minutes.schema': { MinutesSchema, '@noCallThru': true},
        '/imports/collections/meetingseries.schema': { MeetingSeriesSchema, '@noCallThru': true},
        '/imports/config/GlobalSettings': { GlobalSettings, '@noCallThru': true}
    });
