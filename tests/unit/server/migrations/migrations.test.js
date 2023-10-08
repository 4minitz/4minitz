import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const doNothing = () => {};

const moment = () => ({ format: sinon.stub() });
moment["@noCallThru"] = true;

const Migrations = {
  getVersion: sinon.stub().returns(0),
  _list: [],
  migrateTo: sinon.spy(),
  add: doNothing,
};
const Meteor = {};
const backupMongo = sinon.spy();
const join = sinon.stub().returns("outputdir");

const proxyquireFakes = {
  "meteor/percolate:migrations": { Migrations, "@noCallThru": true },
  "moment/moment": moment,
  "/imports/collections/minutes.schema": { Meteor, "@noCallThru": true },
  "meteor/meteor": { Meteor, "@noCallThru": true },
  path: { join, "@noCallThru": true },
  "../mongoBackup": { backupMongo, "@noCallThru": true },
};

for (let i = 0; i < 99; ++i) {
  proxyquireFakes[`./migrate_v${i}`] = { unused: true, "@noCallThru": true };
}

const { handleMigration } = proxyquire(
  "../../../../server/migrations/migrations",
  proxyquireFakes,
);

describe("Migrations", () => {
  describe("#handleMigration", () => {
    beforeEach(() => {
      sinon.spy(console, "warn");

      Migrations._list = [];

      Meteor.settings = { db: { mongodumpTargetDirectory: "outputdir" } };

      backupMongo.resetHistory();
      Migrations.migrateTo.resetHistory();
    });

    afterEach(() => {
      console.warn.restore();
    });

    it("creates a backup for the mongodb if a migration is due", () => {
      Migrations._list.push({ version: 1 });

      handleMigration();

      expect(backupMongo.calledOnce).to.equal(true);
    });

    it("omits the creation of a backup if no target directory is set", () => {
      Meteor.settings.db.mongodumpTargetDirectory = "";
      Migrations._list.push({ version: 1 });

      handleMigration();

      expect(console.warn.calledOnce).to.equal(true);
    });

    it("no settings defined will issue a warning about missing the target dir config", () => {
      Meteor.settings = undefined;
      Migrations._list.push({ version: 1 });

      handleMigration();

      expect(console.warn.calledOnce).to.equal(true);
    });

    it("no db settings defined will issue a warning about missing the target dir config", () => {
      Meteor.settings.db = undefined;
      Migrations._list.push({ version: 1 });

      handleMigration();

      expect(console.warn.calledOnce).to.equal(true);
    });

    it("migrates to the newest version if one is due", () => {
      Migrations._list.push({ version: 1 });

      handleMigration();

      expect(Migrations.migrateTo.calledWith("latest")).to.equal(true);
    });

    it("does not create a backup if no migration is necessary", () => {
      handleMigration();

      expect(backupMongo.called).to.equal(false);
    });

    it("does not migrate if no migration is necessary", () => {
      handleMigration();

      expect(Migrations.migrateTo.called).to.equal(false);
    });
  });
});
