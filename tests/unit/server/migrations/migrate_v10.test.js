import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

require("../../../../imports/helpers/date");

const FIRST_MIN_ID = "#Min01";
const SND_MIN_ID = "#Min02";

const MinutesSchema = { update: sinon.stub(), find: sinon.stub() };
MinutesSchema.getCollection = (_) => MinutesSchema;

const MeetingSeriesSchema = { update: sinon.stub() };
MeetingSeriesSchema.getCollection = (_) => MeetingSeriesSchema;

const MinutesFinder = {
  firstMinutesResult: undefined,
  firstMinutesOfMeetingSeries() {
    return this.firstMinutesResult;
  },
  nextMinutesResult: {},
  nextMinutes(minutes) {
    console.log(
      `finding next minutes of ${minutes._id}: ${
        this.nextMinutesResult[minutes._id]
      }`,
    );
    return this.nextMinutesResult[minutes._id];
  },
};
class MeteorError {}
const Meteor = { Error: MeteorError };

const { MigrateV10 } = proxyquire("../../../../server/migrations/migrate_v10", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/services/minutesFinder": { MinutesFinder, "@noCallThru": true },
});

describe("Migrate Version 10", () => {
  let firstFakeMinute, sndFakeMinute, fakeMeetingSeries;

  beforeEach(() => {
    sndFakeMinute = {
      _id: SND_MIN_ID,
      topics: [{ _id: "#T01" }, { _id: "#T02" }],
    };

    firstFakeMinute = { _id: FIRST_MIN_ID, topics: [{ _id: "#T01" }] };

    fakeMeetingSeries = {
      _id: "#MS01",
      topics: [{ _id: "#T01" }, { _id: "#T02" }],
      openTopics: [{ _id: "#T02" }, { _id: "#T01" }],
    };

    MinutesFinder.firstMinutesResult = firstFakeMinute;
    MinutesFinder.nextMinutesResult[SND_MIN_ID] = false;
    MinutesFinder.nextMinutesResult[FIRST_MIN_ID] = sndFakeMinute;

    MeetingSeriesSchema.find = () => {
      return [fakeMeetingSeries];
    };

    MinutesSchema.find.returns([firstFakeMinute, sndFakeMinute]);
  });

  afterEach(() => {
    MinutesSchema.update.resetHistory();
    MinutesSchema.find.reset();
    MeetingSeriesSchema.update.resetHistory();
  });

  describe("#up", () => {
    const checkTopicHasProperty = (topic) => {
      expect(topic).to.have.ownProperty("createdInMinute");
    };

    it("sets the createdInMinutes attribute for all topics in all minutes", () => {
      MigrateV10.up();
      firstFakeMinute.topics.forEach(checkTopicHasProperty);
      sndFakeMinute.topics.forEach(checkTopicHasProperty);
    });

    it("sets the createdInMinutes attribute for all topics in the meeting series", () => {
      MigrateV10.up();
      fakeMeetingSeries.topics.forEach(checkTopicHasProperty);
      fakeMeetingSeries.openTopics.forEach(checkTopicHasProperty);
    });

    it("sets the correct id for the createdInMinute-attribute", () => {
      MigrateV10.up();
      expect(firstFakeMinute.topics[0].createdInMinute).to.equal(FIRST_MIN_ID);
      expect(sndFakeMinute.topics[0].createdInMinute).to.equal(FIRST_MIN_ID);
      expect(fakeMeetingSeries.topics[0].createdInMinute).to.equal(
        FIRST_MIN_ID,
      );
      expect(fakeMeetingSeries.openTopics[1].createdInMinute).to.equal(
        FIRST_MIN_ID,
      );

      expect(sndFakeMinute.topics[1].createdInMinute).to.equal(SND_MIN_ID);
      expect(fakeMeetingSeries.topics[1].createdInMinute).to.equal(SND_MIN_ID);
      expect(fakeMeetingSeries.openTopics[0].createdInMinute).to.equal(
        SND_MIN_ID,
      );
    });
  });

  describe("#down", () => {
    beforeEach(() => {
      const addCreatedInMinuteFakeAttribute = (topic) => {
        topic.createdInMinute = "fakeID";
      };
      firstFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
      sndFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
      fakeMeetingSeries.topics.forEach(addCreatedInMinuteFakeAttribute);
      fakeMeetingSeries.openTopics.forEach(addCreatedInMinuteFakeAttribute);
    });

    it("removes the createdInMinute-attribute", () => {
      MigrateV10.down();

      const checkTopicHasNoAttribute = (topic) => {
        expect(topic).not.have.ownProperty("createdInMinute");
      };

      firstFakeMinute.topics.forEach(checkTopicHasNoAttribute);
      sndFakeMinute.topics.forEach(checkTopicHasNoAttribute);
      fakeMeetingSeries.topics.forEach(checkTopicHasNoAttribute);
      fakeMeetingSeries.openTopics.forEach(checkTopicHasNoAttribute);
    });
  });
});
