
// TODO: This migrate_v8 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration tests

import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

require('../../../lib/helpers');

class MeteorError {}
let Meteor = {
    call: sinon.stub(),
    Error: MeteorError
};

let MeetingSeriesCollection = {
};

let GlobalSettings = {};

const {
        MigrateV8
    } = proxyquire('../../../server/migrate_v8', {
        'meteor/meteor': { Meteor, '@noCallThru': true},
        '/imports/collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true},
        '/imports/GlobalSettings': { GlobalSettings, '@noCallThru': true}
    });
