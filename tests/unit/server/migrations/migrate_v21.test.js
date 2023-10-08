import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const MeetingSeriesSchema = { find: sinon.stub() };
MeetingSeriesSchema.getCollection = () => MeetingSeriesSchema;

const TopicSchema = {
  update: sinon.stub(),
};
TopicSchema.getCollection = (_) => TopicSchema;

const MinutesFinder = {
  firstMinutesOfMeetingSeries: sinon.stub(),
  nextMinutes: sinon.stub(),
};
const TopicsFinder = {
  allTopicsOfMeetingSeries: sinon.stub(),
};

const { MigrateV21 } = proxyquire("../../../../server/migrations/migrate_v21", {
  "../../imports/services/minutesFinder": {
    MinutesFinder,
    "@noCallThru": true,
  },
  "../../imports/services/topicsFinder": { TopicsFinder, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/collections/topic.schema": { TopicSchema, "@noCallThru": true },
});

describe("Migrate Version 21", () => {
  describe("#up", () => {
    const topic1 = "topic#1";
    const topic2 = "topic#2";

    beforeEach(() => {
      const firstMinutes = {
        _id: "min#01",
        isFinalized: true,
        topics: [
          { _id: topic1, infoItems: [{ _id: "item#1.1", isNew: true }] },
          { _id: topic2, infoItems: [{ _id: "item#2.1", isNew: true }] },
        ],
      };
      const secondMinutes = {
        _id: "min#02",
        isFinalized: true,
        topics: [
          { _id: topic1, infoItems: [{ _id: "item#1.2", isNew: true }] },
          { _id: topic2, infoItems: [{ _id: "item#1.2", isNew: true }] },
        ],
      };
      const thirdMinutes = {
        _id: "min#03",
        isFinalized: false,
        topics: [
          { _id: topic1, infoItems: [{ _id: "item#1.3", isNew: true }] },
          { _id: topic2, infoItems: [{ _id: "item#2.3", isNew: true }] },
        ],
      };

      const meetingSeries = { _id: "ms#01" };
      const topicsOfFirstSeries = [
        { _id: topic1, infoItems: [{ _id: "item#1.2", isNew: true }] },
        { _id: topic2, infoItems: [{ _id: "item#2.2", isNew: true }] },
      ];

      MeetingSeriesSchema.find.returns([meetingSeries]);
      TopicsFinder.allTopicsOfMeetingSeries
        .withArgs(meetingSeries._id)
        .returns(topicsOfFirstSeries);

      MinutesFinder.firstMinutesOfMeetingSeries
        .withArgs(meetingSeries)
        .returns(firstMinutes);
      MinutesFinder.nextMinutes.withArgs(firstMinutes).returns(secondMinutes);
      MinutesFinder.nextMinutes.withArgs(secondMinutes).returns(thirdMinutes);
      MinutesFinder.nextMinutes.withArgs(thirdMinutes).returns(false);
    });

    afterEach(() => {
      MeetingSeriesSchema.find.resetHistory();
      TopicSchema.update.resetHistory();
      MinutesFinder.firstMinutesOfMeetingSeries.resetHistory();
      MinutesFinder.nextMinutes.resetHistory();
      TopicsFinder.allTopicsOfMeetingSeries.resetHistory();
    });

    it("calls the update method of the topics collection for both topics", () => {
      MigrateV21.up();
      expect(TopicSchema.update.callCount).to.equal(2);
    });

    it("calls the update method of the topics collection with the correct topic id as query", () => {
      MigrateV21.up();
      const updateCallArgs = TopicSchema.update.getCall(0).args;
      expect(updateCallArgs[0]).to.equal(topic1);
    });

    it("sends the existing and the missing items to the update call of the topics collection", () => {
      MigrateV21.up();
      const itemsInUpdateCall =
        TopicSchema.update.getCall(0).args[1].$set.infoItems;
      expect(itemsInUpdateCall).to.have.length(2);

      const itemIdsInUpdateCall = itemsInUpdateCall.map((item) => item._id);
      expect(itemIdsInUpdateCall).to.contain("item#1.1");
      expect(itemIdsInUpdateCall).to.contain("item#1.2");
    });
  });

  describe("#down", () => {
    it("should exist", () => {
      expect(MigrateV21).to.have.ownProperty("down");
    });
  });
});
