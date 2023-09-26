import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

let MeetingSeriesSchema = { findOne: sinon.stub() };
MeetingSeriesSchema.getCollection = () => MeetingSeriesSchema;

const TopicSchema = {
  find: sinon.stub(),
  update: sinon.stub(),
};
TopicSchema.getCollection = () => TopicSchema;

const { MigrateV22 } = proxyquire("../../../../server/migrations/migrate_v22", {
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/collections/topic.schema": { TopicSchema, "@noCallThru": true },
});

describe("Migrate Version 22", function () {
  describe("#up", function () {
    const topic1 = "topic#1";
    const topic2 = "topic#2";
    const topic3 = "topic#3";

    beforeEach(function () {
      const meetingSeries = { _id: "ms#01", visibleFor: ["u#1", "u#2"] };
      const anotherSeries = { _id: "ms#01", visibleFor: ["u#3"] };
      const topicsOfFirstSeries = [
        { _id: topic1, parentId: "ms#01" },
        { _id: topic2, parentId: "ms#01" },
      ];
      const topicsOfAnotherSeries = [{ _id: topic3, parentId: "ms#02" }];
      TopicSchema.find.returns(
        topicsOfFirstSeries.concat(topicsOfAnotherSeries),
      );
      MeetingSeriesSchema.findOne.withArgs("ms#01").returns(meetingSeries);
      MeetingSeriesSchema.findOne.withArgs("ms#02").returns(anotherSeries);
    });

    afterEach(function () {
      MeetingSeriesSchema.findOne.reset();
      TopicSchema.update.resetHistory();
      TopicSchema.find.reset();
    });

    it("calls the update method of the topics collection for all three topics", function () {
      MigrateV22.up();
      expect(TopicSchema.update.callCount).to.equal(3);
    });

    it("queries the meeting series collection once for each series id", function () {
      MigrateV22.up();
      expect(MeetingSeriesSchema.findOne.callCount).to.equal(2);
      expect(MeetingSeriesSchema.findOne.calledWithExactly("ms#01")).to.be.true;
      expect(MeetingSeriesSchema.findOne.calledWithExactly("ms#02")).to.be.true;
    });
  });

  describe("#down", function () {
    it("should exist", function () {
      expect(MigrateV22).to.have.ownProperty("down");
    });
  });
});
