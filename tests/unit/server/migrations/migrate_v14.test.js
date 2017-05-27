import { expect } from 'chai';
import proxyquire from 'proxyquire';

let Meteor = {};

const {
    MigrateV14
} = proxyquire('../../../../server/migrations/migrate_v14', {
    'meteor/meteor': { Meteor, '@noCallThru': true}
});
