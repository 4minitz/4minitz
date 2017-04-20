
// TODO: This migrate_v9 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

require('../../../../lib/date');

let MinutesCollection = {
};

const {
        MigrateV9
    } = proxyquire('../../../../server/migrations/migrate_v9', {
        '/imports/collections/minutes_private': { MinutesCollection, '@noCallThru': true}
    });
