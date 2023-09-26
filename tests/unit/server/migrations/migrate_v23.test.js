import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

let Meteor = {};

let MinutesSchemaCollection = { find: sinon.stub(), update: sinon.spy() };
let MinutesSchema = { getCollection: sinon.stub() };

let TopicSchemaCollection = { find: sinon.stub(), update: sinon.spy() };
let TopicSchema = { getCollection: sinon.stub() };

const { MigrateV23 } = proxyquire("../../../../server/migrations/migrate_v23", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/topic.schema": { TopicSchema, "@noCallThru": true },
});

describe("MigrateV23", function () {
  describe("#up", function () {
    const topicWithResponsiblesNull = { responsibles: null },
      topicsWithResponsiblesDefined = { responsibles: [1, 2, 3] };

    beforeEach(function () {
      TopicSchemaCollection.find.returns([]);
      MinutesSchemaCollection.find.returns([]);
      MinutesSchema.getCollection.returns(MinutesSchemaCollection);
      TopicSchema.getCollection.returns(TopicSchemaCollection);
    });

    afterEach(function () {
      TopicSchemaCollection.find.reset();
      TopicSchemaCollection.update.resetHistory();
      TopicSchema.getCollection.reset();

      MinutesSchemaCollection.find.reset();
      MinutesSchemaCollection.update.resetHistory();
      MinutesSchema.getCollection.reset();
    });

    it("calls update method for every topic in the topic collection which has no responsibles set", function () {
      const topics = [topicWithResponsiblesNull, topicsWithResponsiblesDefined];
      TopicSchemaCollection.find.returns(topics);

      MigrateV23.up();

      const expectedNumberOfCallsToUpdate = 1;
      expect(TopicSchemaCollection.update.callCount).to.equal(
        expectedNumberOfCallsToUpdate,
      );
    });

    it("converts null in topic collection entries to an empty array", function () {
      TopicSchemaCollection.find.returns([topicWithResponsiblesNull]);

      MigrateV23.up();

      expect(
        TopicSchemaCollection.update.calledWithExactly(undefined, {
          $set: { responsibles: [] },
        }),
      ).to.be.true;
    });

    it("does not update topics with responsibles already set", function () {
      TopicSchemaCollection.find.returns([topicsWithResponsiblesDefined]);

      MigrateV23.up();

      expect(TopicSchemaCollection.update.called).to.be.false;
    });

    it("calls the update method for every minutes which contains at least one topic where the responsibles field is not an array", function () {
      const minutes = [{ topics: [topicWithResponsiblesNull] }];
      MinutesSchemaCollection.find.returns(minutes);

      MigrateV23.up();

      const expectedNumberOfCallsToUpdate = 1;
      expect(MinutesSchemaCollection.update.callCount).to.equal(
        expectedNumberOfCallsToUpdate,
      );
    });

    it("converts null in topic collection entries to an empty array", function () {
      const minutesWithATopicWithNull = [
        { topics: [topicWithResponsiblesNull] },
      ];
      MinutesSchemaCollection.find.returns(minutesWithATopicWithNull);

      MigrateV23.up();

      expect(
        MinutesSchemaCollection.update.calledWithExactly(undefined, {
          $set: { topics: [{ responsibles: [] }] },
        }),
      ).to.be.true;
    });

    it("does not modify responsibles that already are defined", function () {
      const minutesWithATopicWithNull = [
        { topics: [topicsWithResponsiblesDefined] },
      ];
      MinutesSchemaCollection.find.returns(minutesWithATopicWithNull);

      MigrateV23.up();

      expect(
        MinutesSchemaCollection.update.calledWithExactly(undefined, {
          $set: { topics: [topicsWithResponsiblesDefined] },
        }),
      ).to.be.true;
    });
  });
});
