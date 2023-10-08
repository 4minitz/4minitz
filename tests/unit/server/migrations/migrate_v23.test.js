import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const Meteor = {};

const MinutesSchemaCollection = { find: sinon.stub(), update: sinon.spy() };
const MinutesSchema = { getCollection: sinon.stub() };

const TopicSchemaCollection = { find: sinon.stub(), update: sinon.spy() };
const TopicSchema = { getCollection: sinon.stub() };

const { MigrateV23 } = proxyquire("../../../../server/migrations/migrate_v23", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/topic.schema": { TopicSchema, "@noCallThru": true },
});

describe("MigrateV23", () => {
  describe("#up", () => {
    const topicWithResponsiblesNull = { responsibles: null },
      topicsWithResponsiblesDefined = { responsibles: [1, 2, 3] };

    beforeEach(() => {
      TopicSchemaCollection.find.returns([]);
      MinutesSchemaCollection.find.returns([]);
      MinutesSchema.getCollection.returns(MinutesSchemaCollection);
      TopicSchema.getCollection.returns(TopicSchemaCollection);
    });

    afterEach(() => {
      TopicSchemaCollection.find.reset();
      TopicSchemaCollection.update.resetHistory();
      TopicSchema.getCollection.reset();

      MinutesSchemaCollection.find.reset();
      MinutesSchemaCollection.update.resetHistory();
      MinutesSchema.getCollection.reset();
    });

    it("calls update method for every topic in the topic collection which has no responsibles set", () => {
      const topics = [topicWithResponsiblesNull, topicsWithResponsiblesDefined];
      TopicSchemaCollection.find.returns(topics);

      MigrateV23.up();

      const expectedNumberOfCallsToUpdate = 1;
      expect(TopicSchemaCollection.update.callCount).to.equal(
        expectedNumberOfCallsToUpdate,
      );
    });

    it("converts null in topic collection entries to an empty array", () => {
      TopicSchemaCollection.find.returns([topicWithResponsiblesNull]);

      MigrateV23.up();

      expect(
        TopicSchemaCollection.update.calledWithExactly(undefined, {
          $set: { responsibles: [] },
        }),
      ).to.be.true;
    });

    it("does not update topics with responsibles already set", () => {
      TopicSchemaCollection.find.returns([topicsWithResponsiblesDefined]);

      MigrateV23.up();

      expect(TopicSchemaCollection.update.called).to.be.false;
    });

    it("calls the update method for every minutes which contains at least one topic where the responsibles field is not an array", () => {
      const minutes = [{ topics: [topicWithResponsiblesNull] }];
      MinutesSchemaCollection.find.returns(minutes);

      MigrateV23.up();

      const expectedNumberOfCallsToUpdate = 1;
      expect(MinutesSchemaCollection.update.callCount).to.equal(
        expectedNumberOfCallsToUpdate,
      );
    });

    it("converts null in topic collection entries to an empty array", () => {
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

    it("does not modify responsibles that already are defined", () => {
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
