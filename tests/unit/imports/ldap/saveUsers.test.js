import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import asyncStubs from '../../../support/lib/asyncStubs';

let MongoClient = {
    connect: asyncStubs.doNothing(),
};

let generate = sinon.stub().returns('123abc');

let bulk = {
    find: sinon.stub(),
    execute: sinon.stub()
};

let db = {
    collection: sinon.stub().returns({
        initializeUnorderedBulkOp: sinon.stub().returns(bulk)
    }),
    close: sinon.stub()
};

let upsert = {
    upsert: sinon.stub()
};

let updateOne = {
    updateOne: sinon.stub()
};

let mongoUrl = 'mongodb://host:port/db';
let users = [{
    cn: 'username',
    mail: 'user@example.com',
    password: 'p@ssw0rd'
}];

const saveUsers = proxyquire('../../../../imports/ldap/saveUsers', {
    'mongodb': { MongoClient, '@noCallThru': true},
    'randomstring': { generate, '@noCallThru': true}
});

describe('saveUsers', function () {
    let settings;
  
    beforeEach(function () {
        MongoClient.connect = asyncStubs.doNothing();
        bulk.find.reset();
        bulk.execute.reset();
        db.close.reset();
        upsert.upsert.reset();
        updateOne.updateOne.reset();

        settings = {
            propertyMap: {},
            whiteListedFields: [],
            inactiveUsers: {
                strategy: 'none'
            }
        };
    });

    it('inserts users into database', function (done) {
        MongoClient.connect = asyncStubs.returns(1, db);
        upsert.upsert.returns(updateOne);
        bulk.find.returns(upsert);
        bulk.execute.returns('bulk done');

        saveUsers(settings, mongoUrl, users)
            .then((result) => {
                try {
                    expect(result).to.deep.equal('bulk done');
                    expect(bulk.find.calledOnce).to.be.true;
                    expect(bulk.execute.calledOnce).to.be.true;

                    done();
                } catch (error) {
                    done(error);
                }
            })
            .catch((error) => {
                done(new Error(error));
            });
    });

    it('handles database connection problems', function (done) {
        MongoClient.connect = asyncStubs.returnsError(1, 'Connection error');

        saveUsers(settings, mongoUrl, users)
            .then((result) => {
                done(new Error(`Unexpected result: ${result}`));
            })
            .catch((error) => {
                try {
                    expect(error).to.equal('Connection error');
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });});
