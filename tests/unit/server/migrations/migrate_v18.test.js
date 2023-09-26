import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

let MinutesSchema = { find: sinon.stub(), update: sinon.stub() };
MinutesSchema.getCollection = () => MinutesSchema;

let MeetingSeriesSchema = { find: sinon.stub() };
MeetingSeriesSchema.getCollection = () => MeetingSeriesSchema;

let TopicSchema = { find: sinon.stub(), update: sinon.stub() };
TopicSchema.getCollection = () => TopicSchema;

let MinutesFinder = {
  firstMinutesOfMeetingSeries: sinon.stub(),
  nextMinutes: sinon.stub(),
};

const { MigrateV18 } = proxyquire("../../../../server/migrations/migrate_v18", {
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/collections/topic.schema": { TopicSchema, "@noCallThru": true },
  "../../imports/services/minutesFinder": {
    MinutesFinder,
    "@noCallThru": true,
  },
});

describe("Migrate Version 18", function () {
  let firstMinutes,
    secondMinutes,
    topicFirstAndSecondMinutes,
    topicFirstMinutes,
    topicSecondMinutes,
    itemFirstAndSecondMinutes,
    itemSecondMinutes;

  beforeEach(function () {
    itemFirstAndSecondMinutes = {
      _id: "Item_AaBbCc01",
      details: [{ _id: "Detail_AaBbCc01" }],
    };
    itemSecondMinutes = { _id: "Item_AaBbCc02" };

    topicFirstAndSecondMinutes = {
      _id: "AaBbCc01",
      infoItems: [JSON.parse(JSON.stringify(itemFirstAndSecondMinutes))],
    };
    topicFirstMinutes = { _id: "AaBbCc02", infoItems: [] };
    topicSecondMinutes = {
      _id: "AaBbCc03",
      infoItems: [
        JSON.parse(JSON.stringify(itemFirstAndSecondMinutes)),
        JSON.parse(JSON.stringify(itemSecondMinutes)),
      ],
    };

    firstMinutes = {
      _id: "MinAaBb01",
      date: "2017-08-21",
      createdAt: new Date("2017-08-21 12:53"),
      isFinalized: true,
      topics: [topicFirstAndSecondMinutes, topicFirstMinutes],
    };
    secondMinutes = {
      _id: "MinAaBb02",
      date: "2017-08-28",
      createdAt: new Date("2017-08-25 12:53"),
      isFinalized: false,
      topics: [topicFirstAndSecondMinutes, topicSecondMinutes],
    };
    MinutesSchema.find.returns([firstMinutes, secondMinutes]);
    TopicSchema.find.returns([topicFirstAndSecondMinutes, topicFirstMinutes]);
    const meetingSeries = {};
    MeetingSeriesSchema.find.returns([meetingSeries]);
    MinutesFinder.firstMinutesOfMeetingSeries.returns(firstMinutes);
    MinutesFinder.nextMinutes.withArgs(firstMinutes).returns(secondMinutes);
    MinutesFinder.nextMinutes.withArgs(secondMinutes).returns(false);
  });

  afterEach(function () {
    MinutesSchema.find.resetHistory();
    MinutesSchema.update.resetHistory();
    TopicSchema.update.resetHistory();
    MinutesFinder.firstMinutesOfMeetingSeries.resetHistory();
    MinutesFinder.nextMinutes.resetHistory();
  });

  describe("#up", function () {
    let expectedDateForElementsCreatedInFirstMinutes;
    let expectedDateForElementsCreatedIn2ndMinutes;

    beforeEach(function () {
      expectedDateForElementsCreatedInFirstMinutes = firstMinutes.createdAt;
      expectedDateForElementsCreatedIn2ndMinutes = secondMinutes.createdAt;
    });

    it("calls the update method of the topics collection for each different topic and sets the new fields", function () {
      MigrateV18.up();
      expect(TopicSchema.update.callCount).to.equal(2);

      itemFirstAndSecondMinutes.createdAt =
        expectedDateForElementsCreatedInFirstMinutes;
      itemFirstAndSecondMinutes.updatedAt =
        expectedDateForElementsCreatedInFirstMinutes;
      itemFirstAndSecondMinutes.details[0].createdAt =
        expectedDateForElementsCreatedInFirstMinutes;
      itemFirstAndSecondMinutes.details[0].updatedAt =
        expectedDateForElementsCreatedInFirstMinutes;

      const expectedUpdateParamFirstMinutes = {
        $set: {
          updatedAt: expectedDateForElementsCreatedInFirstMinutes,
          createdAt: expectedDateForElementsCreatedInFirstMinutes,
          infoItems: [],
        },
      };
      const expectedUpdateParamFirstMinutesWithItems = {
        $set: {
          updatedAt: expectedDateForElementsCreatedInFirstMinutes,
          createdAt: expectedDateForElementsCreatedInFirstMinutes,
          infoItems: [itemFirstAndSecondMinutes],
        },
      };

      expect(
        TopicSchema.update.calledWith(
          topicFirstMinutes._id,
          expectedUpdateParamFirstMinutes,
        ),
      ).to.be.true;
      expect(
        TopicSchema.update.calledWith(
          topicFirstAndSecondMinutes._id,
          expectedUpdateParamFirstMinutesWithItems,
        ),
      ).to.be.true;
    });

    it("sets the createdAt/updatedAt fields for all items of each topic in the topics collection", function () {
      MigrateV18.up();

      const argsFirstCall = TopicSchema.update.firstCall.args;

      expect(argsFirstCall[1].$set.infoItems).to.have.length(1);
      expect(argsFirstCall[1].$set.infoItems[0].createdAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
    });

    it("sets the createdAt/updatedAt fields for all items of each topic in the topics collection", function () {
      MigrateV18.up();

      const argsFirstCall = TopicSchema.update.firstCall.args;
      const itemsOfFirstTopic = argsFirstCall[1].$set.infoItems;
      expect(itemsOfFirstTopic[0].details).to.have.length(1);
      expect(itemsOfFirstTopic[0].details[0].createdAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(itemsOfFirstTopic[0].details[0].updatedAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
    });

    it("updates each minutes and sets the createdAt/updatedAt fields for each topic", function () {
      MigrateV18.up();
      expect(MinutesSchema.update.callCount).to.equal(2);

      const argsFirstCall = MinutesSchema.update.firstCall.args;
      const argsSecondCall = MinutesSchema.update.secondCall.args;

      expect(argsFirstCall[0]).to.equal(firstMinutes._id);
      expect(argsSecondCall[0]).to.equal(secondMinutes._id);

      const topcisFirstCall = argsFirstCall[1].$set.topics;
      expect(topcisFirstCall).to.have.length(2);
      expect(topcisFirstCall[0].createdAt.getTime()).to.equal(
        expectedDateForElementsCreatedInFirstMinutes.getTime(),
      );
      expect(topcisFirstCall[0].updatedAt.getTime()).to.equal(
        expectedDateForElementsCreatedInFirstMinutes.getTime(),
      );
      expect(topcisFirstCall[1].createdAt.getTime()).to.equal(
        expectedDateForElementsCreatedInFirstMinutes.getTime(),
      );
      expect(topcisFirstCall[1].updatedAt.getTime()).to.equal(
        expectedDateForElementsCreatedInFirstMinutes.getTime(),
      );

      const topcis2ndCall = argsSecondCall[1].$set.topics;
      expect(topcis2ndCall).to.have.length(2);
      expect(topcis2ndCall[0].createdAt.getTime()).to.equal(
        expectedDateForElementsCreatedInFirstMinutes.getTime(),
      );
      expect(topcis2ndCall[0].updatedAt.getTime()).to.equal(
        expectedDateForElementsCreatedInFirstMinutes.getTime(),
      );
      expect(topcis2ndCall[1].createdAt.getTime()).to.equal(
        expectedDateForElementsCreatedIn2ndMinutes.getTime(),
      );
      expect(topcis2ndCall[1].updatedAt.getTime()).to.equal(
        expectedDateForElementsCreatedIn2ndMinutes.getTime(),
      );
    });

    it("sets the createdAt/updatedAt field for all items of each topic in the minutes collection", function () {
      MigrateV18.up();

      const argsFirstCall = MinutesSchema.update.firstCall.args;
      const argsSecondCall = MinutesSchema.update.secondCall.args;

      const topicsFirstCall = argsFirstCall[1].$set.topics;
      expect(topicsFirstCall[0].infoItems).to.have.length(1);
      expect(topicsFirstCall[0].infoItems[0].createdAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(topicsFirstCall[0].infoItems[0].updatedAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );

      const topics2ndCall = argsSecondCall[1].$set.topics;
      expect(topics2ndCall[0].infoItems).to.have.length(1);
      expect(topics2ndCall[0].infoItems[0].createdAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(topics2ndCall[0].infoItems[0].updatedAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(topics2ndCall[1].infoItems).to.have.length(2);
      expect(topics2ndCall[1].infoItems[0].createdAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(topics2ndCall[1].infoItems[0].updatedAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(topics2ndCall[1].infoItems[1].createdAt).to.equal(
        expectedDateForElementsCreatedIn2ndMinutes,
      );
      expect(topics2ndCall[1].infoItems[1].updatedAt).to.equal(
        expectedDateForElementsCreatedIn2ndMinutes,
      );
    });

    it("sets the createdAt/updatedAt field for all details of the items of a topic in the minutes collection", function () {
      MigrateV18.up();

      const argsFirstCall = MinutesSchema.update.firstCall.args;
      const argsSecondCall = MinutesSchema.update.secondCall.args;

      const itemsFirstCall = argsFirstCall[1].$set.topics[0].infoItems;
      expect(itemsFirstCall[0].details).to.have.length(1);
      expect(itemsFirstCall[0].details[0].createdAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(itemsFirstCall[0].details[0].updatedAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );

      const items2ndCall = argsSecondCall[1].$set.topics[0].infoItems;
      expect(items2ndCall[0].details).to.have.length(1);
      expect(items2ndCall[0].details[0].createdAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
      expect(items2ndCall[0].details[0].updatedAt).to.equal(
        expectedDateForElementsCreatedInFirstMinutes,
      );
    });
  });

  describe("#down", function () {
    beforeEach(function () {
      [topicFirstAndSecondMinutes, topicFirstMinutes, topicSecondMinutes].map(
        (topic) => {
          topic.createdAt = new Date();
          topic.updatedAt = new Date();
          topic.infoItems = topic.infoItems.map((item) => {
            item.createdAt = new Date();
            item.updatedAt = new Date();
            return item;
          });
          return topic;
        },
      );
    });

    it("deletes createdAt/updatedAt fields of all documents stored in the topics collection", function () {
      MigrateV18.down();
      expect(TopicSchema.update.callCount).to.equal(2);
      expect(
        TopicSchema.update.calledWith(topicFirstMinutes._id, {
          $set: topicFirstMinutes,
        }),
      ).to.be.true;
      expect(
        TopicSchema.update.calledWith(topicFirstAndSecondMinutes._id, {
          $set: topicFirstAndSecondMinutes,
        }),
      ).to.be.true;
    });

    it("deletes createdAt/updatedAt fields of all documents stored in each minutes and updates them", function () {
      MigrateV18.down();
      expect(MinutesSchema.update.calledTwice).to.be.true;
      const { firstCall, secondCall } = MinutesSchema.update;
      expect(firstCall.args[0]).to.equal(firstMinutes._id);
      expect(secondCall.args[0]).to.equal(secondMinutes._id);
      const topicsOfFirstCall = firstCall.args[1].$set.topics;
      const topicContainsInvalidField = (topic) =>
        topic.createdAt || topic.updatedAt;
      expect(topicsOfFirstCall.some(topicContainsInvalidField)).to.be.false;
      const topicsOf2ndCall = secondCall.args[1].$set.topics;
      expect(topicsOf2ndCall.some(topicContainsInvalidField)).to.be.false;
    });
  });
});
