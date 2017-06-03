
// TODO: This migrate_v6 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

require('../../../../imports/helpers/date');

class MeteorError {}
let Meteor = {
    call: sinon.stub(),
    Error: MeteorError
};

let MinutesSchema = {};

let MeetingSeriesSchema = {};

const {
        MigrateV6
    } = proxyquire('../../../../server/migrations/migrate_v6', {
        'meteor/meteor': { Meteor, '@noCallThru': true},
        '/imports/collections/minutes.schema': { MinutesSchema, '@noCallThru': true},
        '/imports/collections/meetingseries.schema': { MeetingSeriesSchema, '@noCallThru': true}
    });
