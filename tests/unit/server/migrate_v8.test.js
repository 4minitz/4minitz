
// TODO: This migrate_v8 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';

require('../../../lib/helpers');

let MeetingSeriesCollection = {
};

let GlobalSettings = {};

const {
        MigrateV8
    } = proxyquire('../../../server/migrate_v8', {
        '/imports/collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true},
        '/imports/GlobalSettings': { GlobalSettings, '@noCallThru': true}
    });
