import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const Meteor = {};

const MinutesSchemaCollection = { update: sinon.spy() };
const MinutesSchema = { find: sinon.stub(), getCollection: sinon.stub() };

const { MigrateV24 } = proxyquire("../../../../server/migrations/migrate_v24", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
});

describe("MigrateV24", () => {
  describe("#up", () => {
    const FakeMinutes = { topics: [{ infoItems: [{ details: [] }] }] };

    beforeEach(() => {
      MinutesSchema.find.returns([FakeMinutes]);
      MinutesSchema.getCollection.returns(MinutesSchemaCollection);
    });

    afterEach(() => {
      MinutesSchema.find.reset();
      MinutesSchemaCollection.update.resetHistory();
      MinutesSchema.getCollection.reset();
    });

    it("calls the update method for every minutes", () => {
      MigrateV24.up();

      const expectedNumberOfCallsToUpdate = 1;
      expect(MinutesSchemaCollection.update.callCount).to.equal(
        expectedNumberOfCallsToUpdate,
      );
    });
  });
});
