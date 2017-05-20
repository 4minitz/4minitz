
// TODO: This migrate_v7 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';

require('../../../../imports/helpers/date');

let MinutesCollection = {
};

let MeetingSeriesCollection = {
};

let GlobalSettings = {};

const {
        MigrateV7
    } = proxyquire('../../../../server/migrations/migrate_v7', {
        '/imports/collections/minutes_private': { MinutesCollection, '@noCallThru': true},
        '/imports/collections/meetingseries.schema': { MeetingSeriesCollection, '@noCallThru': true},
        '/imports/config/GlobalSettings': { GlobalSettings, '@noCallThru': true}
    });
