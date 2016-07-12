import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let doNothing = () => {};

let moment = function () {
    return {
        format: sinon.stub()
    };
};
moment['@noCallThru'] = true;

let Migrations = {
    getVersion: sinon.stub().returns(0),
    _list: [],
    migrateTo: sinon.spy(),
    add: doNothing
};
let Meteor = {
    settings: {
        db: {
            mongodumpTargetDirectory: 'outputdir'
        }
    }
};
let backupMongo = sinon.spy();
let join = sinon.stub().returns('outputdir');

const { handleMigration } = proxyquire('../../../server/migrations', {
    'meteor/percolate:migrations': { Migrations, '@noCallThru': true},
    'moment/moment': moment,
    'meteor/meteor': { Meteor, '@noCallThru': true},
    'path': { join, '@noCallThru': true},
    './mongoBackup': { backupMongo, '@noCallThru': true}
});

describe('Migrations', function () {
    describe('#handleMigration', function () {
        beforeEach(function () {
            sinon.spy(console, 'warn');

            Migrations._list = [];

            backupMongo.reset();
            Migrations.migrateTo.reset();
        });

        afterEach(function () {
            console.warn.restore();
        });

        it('creates a backup for the mongodb if a migration is due', function () {
            Migrations._list.push({version: 1});

            handleMigration();

            expect(backupMongo.calledOnce).to.equal(true);
        });

        it('omits the creation of a backup if no target directory is set', function () {
            Meteor.settings.db.mongodumpTargetDirectory = '';
            Migrations._list.push({version: 1});

            handleMigration();

            expect(console.warn.calledOnce).to.equal(true);
        });

        it('migrates to the newest version if one is due', function () {
            Migrations._list.push({version: 1});

            handleMigration();

            expect(Migrations.migrateTo.calledWith('latest')).to.equal(true);
        });

        it('does not create a backup if no migration is necessary', function () {
            handleMigration();

            expect(backupMongo.called).to.equal(false);
        });

        it('does not migrate if no migration is necessary', function () {
            handleMigration();

            expect(Migrations.migrateTo.called).to.equal(false);
        });
    });
});
