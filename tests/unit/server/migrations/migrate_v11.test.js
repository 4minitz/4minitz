
// TODO: This migrate_v11 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import proxyquire from 'proxyquire';

let Meteor = {};

const {
        MigrateV11
    } = proxyquire('../../../../server/migrations/migrate_v11', {
        'meteor/meteor': { Meteor, '@noCallThru': true}
});
