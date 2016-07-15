import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let spawn = sinon.stub().returns({on: sinon.spy()});

let Future = function () {
    this['return'] = sinon.spy();
    this.wait = sinon.spy();
};
Future['@noCallThru'] = true;

const {
    backupMongo
} = proxyquire('../../../server/mongoBackup', {
    'child_process': { spawn: spawn, '@noCallThru': true},
    'fibers/future': Future
});

describe('mongoBackup', function () {
    describe('#backupMongo', function () {

        beforeEach(function () {
            spawn.reset();
        });

        it('uses mongodump to create a backup', function () {
            backupMongo('mongodb://user:password@localhost:1234/database', 'outputdir');

            let firstCall = spawn.args[0];
            let command = firstCall[0];
            let parameters = firstCall[1].join(';');

            expect(command).to.equal('mongodump');
            expect(parameters).to.equal('-h;localhost:1234;-u;user;-p;password;-d;database;-o;outputdir');
        });
    });
});
