import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

let Meteor = {};

let MinutesSchemaCollection = {
    find: sinon.stub(),
    update: sinon.spy()
};
let MinutesSchema = {
    getCollection: sinon.stub()
};

const {
    MigrateV24
} = proxyquire('../../../../server/migrations/migrate_v24', {
    'meteor/meteor': { Meteor, '@noCallThru': true},
    '/imports/collections/minutes.schema': { MinutesSchema, '@noCallThru': true}
});

describe('MigrateV24', function () {
    describe('#up', function () {
        const FakeMinutes = {
            topics: [{
                infoItems: [{}, {}]
            }]
        };

        beforeEach(function () {
            MinutesSchemaCollection.find.returns([FakeMinutes]);
            MinutesSchema.getCollection.returns(MinutesSchemaCollection);
        });

        afterEach(function () {
            MinutesSchemaCollection.find.reset();
            MinutesSchemaCollection.update.reset();
            MinutesSchema.getCollection.reset();
        });

        it('calls the update method for every minutes', function () {
            MigrateV24.up();

            const expectedNumberOfCallsToUpdate = 1;
            expect(MinutesSchemaCollection.update.callCount).to.equal(expectedNumberOfCallsToUpdate);
        });
    });
});