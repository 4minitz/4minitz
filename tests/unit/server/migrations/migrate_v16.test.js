import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

let TopicSchema = {
  insert: sinon.stub(),
  find: sinon.stub(),
  remove: sinon.stub(),
};

TopicSchema.getCollection = () => TopicSchema;

let MeetingSeriesSchema = { find: sinon.stub(), update: sinon.stub() };
MeetingSeriesSchema.getCollection = () => MeetingSeriesSchema;

const { MigrateV16 } = proxyquire("../../../../server/migrations/migrate_v16", {
  "../../imports/collections/topic.schema": {
    TopicSchema,
    "@noCallThru": true,
  },
  "../../imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
});

describe("Migrate Version 16", function () {
  const meetingSeriesId = "MS:AaBbCc01";
  const openTopic = { _id: "Topic:AaBbCc01", isOpen: true };
  const closedTopic = { _id: "Topic:AaBbCc02", isOpen: false };
  let meetingSeries;

  beforeEach(function () {
    meetingSeries = [
      {
        _id: meetingSeriesId,
        topics: [openTopic, closedTopic],
        openTopcis: [openTopic],
      },
    ];

    MeetingSeriesSchema.find.returns(meetingSeries);
  });

  afterEach(function () {
    meetingSeries.splice(meetingSeries.length);
    TopicSchema.insert.reset();
    TopicSchema.find.reset();
    TopicSchema.remove.reset();
    MeetingSeriesSchema.update.resetHistory();
    MeetingSeriesSchema.find.reset();
  });

  describe("#up", function () {
    it("calls insert on the topcis collection for each topic of the meeting series", function () {
      MigrateV16.up();
      expect(TopicSchema.insert.calledTwice).to.be.true;
    });

    it("passes the topic with the correct parentId to the insert method", function () {
      MigrateV16.up();
      expect(TopicSchema.insert.firstCall.args[0].parentId).to.equal(
        meetingSeriesId,
      );
      expect(TopicSchema.insert.secondCall.args[0].parentId).to.equal(
        meetingSeriesId,
      );
    });

    it("updates the meeting series and removes the field topics/openTopics", function () {
      MigrateV16.up();
      const expectedFirstArg = meetingSeriesId;
      const expected2ndArg = { $unset: { topics: "", openTopics: "" } };
      expect(MeetingSeriesSchema.update.callCount).to.equal(1);
      expect(
        MeetingSeriesSchema.update.calledWith(expectedFirstArg, expected2ndArg),
      ).to.be.true;
    });
  });

  describe("#down", function () {
    beforeEach(function () {
      openTopic.parentId = meetingSeriesId;
      closedTopic.parentId = meetingSeriesId;
      TopicSchema.find.returns([closedTopic, openTopic]);
    });

    it("sets the fields topics/openTopics of the meeting seires correctly", function () {
      MigrateV16.down();
      expect(MeetingSeriesSchema.update.calledOnce).to.be.true;
      const expectedFirstArg = meetingSeriesId;
      const expected2ndArg = {
        $set: {
          openTopics: [openTopic],
          topics: [openTopic, closedTopic],
        },
      };
      expect(
        MeetingSeriesSchema.update.calledWith(expectedFirstArg, expected2ndArg),
      ).to.be.true;
    });

    it("removes all topics from the topcis collection", function () {
      MigrateV16.down();
      expect(TopicSchema.remove.calledOnce).to.be.true;
      expect(TopicSchema.remove.calledWithExactly({})).to.be.true;
    });
  });
});
