
// TODO: This migrate_v6 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';

require('../../../lib/helpers');

let MinutesCollection = {
};

let MeetingSeriesCollection = {
};

const {
        MigrateV4
    } = proxyquire('../../../server/migrate_v6', {
        '/imports/collections/minutes_private': { MinutesCollection, '@noCallThru': true},
        '/imports/collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true}
    });
