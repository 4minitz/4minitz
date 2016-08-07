import { expect } from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import _ from 'underscore';

const {
    ServerSyncCollection
    } = proxyquire('../../../../imports/collections/ServerSyncCollection', {});

let Meteor = {
    isClient: false
};

let dummyCollection = {
    insert: sinon.stub(),
    update: sinon.stub(),
    remove: sinon.stub()
};

let dummyClientCallback = sinon.stub();

let testObject;

describe('ServerSyncCollection', function() {

    beforeEach('Initialize ServerSyncCollection-Object', function() {
        testObject = new ServerSyncCollection(dummyCollection, Meteor);
    });

    afterEach('Reset stubs', function() {
        dummyCollection.insert.reset();
        dummyCollection.update.reset();
        dummyCollection.remove.reset();
        dummyClientCallback.reset();
        Meteor.isClient = false;
    });

    describe('#insert', function() {

        it('calls the insert method of the collection', function() {
            testObject.insert();
            expect(dummyCollection.insert.calledOnce).to.be.true;
        });

        it('removes the client callback on the server and passes all other parameters', function() {
            testObject.insert(1, 2, 3, dummyClientCallback);
            expect(dummyCollection.insert.calledWithExactly(1, 2, 3, null)).to.be.true;
        });

        it('passes the client callback as last parameter on the client', function() {
            Meteor.isClient = true;
            testObject.insert(1, 2, 3, dummyClientCallback);
            expect(dummyCollection.insert.calledWithExactly(1, 2, 3, dummyClientCallback)).to.be.true;
        });

        it('passes all parameters on the server if last parameter is not a function', function() {
            testObject.insert(1, 2, 3);
            expect(dummyCollection.insert.calledWithExactly(1, 2, 3, null)).to.be.true;
        });

    });

    describe('#update', function() {

        it('calls the update method of the collection', function() {
            testObject.update();
            expect(dummyCollection.update.calledOnce).to.be.true;
        });

        it('removes the client callback on the server and passes all other parameters', function() {
            testObject.update(1, 2, 3, dummyClientCallback);
            expect(dummyCollection.update.calledWithExactly(1, 2, 3, null)).to.be.true;
        });

        it('passes the client callback as last parameter on the client', function() {
            Meteor.isClient = true;
            testObject.update(1, 2, 3, dummyClientCallback);
            expect(dummyCollection.update.calledWithExactly(1, 2, 3, dummyClientCallback)).to.be.true;
        });

        it('passes all parameters on the server if last parameter is not a function', function() {
            testObject.update(1, 2, 3);
            expect(dummyCollection.update.calledWithExactly(1, 2, 3, null)).to.be.true;
        });

    });

    describe('#remove', function() {

        it('calls the remove method of the collection', function() {
            testObject.remove();
            expect(dummyCollection.remove.calledOnce).to.be.true;
        });

        it('removes the client callback on the server and passes all other parameters', function() {
            testObject.remove(1, 2, 3, dummyClientCallback);
            expect(dummyCollection.remove.calledWithExactly(1, 2, 3, null)).to.be.true;
        });

        it('passes the client callback as last parameter on the client', function() {
            Meteor.isClient = true;
            testObject.remove(1, 2, 3, dummyClientCallback);
            expect(dummyCollection.remove.calledWithExactly(1, 2, 3, dummyClientCallback)).to.be.true;
        });

        it('passes all parameters on the server if last parameter is not a function', function() {
            testObject.remove(1, 2, 3);
            expect(dummyCollection.remove.calledWithExactly(1, 2, 3, null)).to.be.true;
        });

    });

});