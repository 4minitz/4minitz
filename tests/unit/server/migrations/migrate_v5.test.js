import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const MinutesSchema = {
  minutes: [],

  find: function () {
    return this.minutes;
  },

  update: sinon.stub(),

  insert: function (minute) {
    this.minutes.push(minute);
  },
};
MinutesSchema.getCollection = (_) => MinutesSchema;

const MeetingSeriesSchema = {
  series: [],

  find: function () {
    return this.series;
  },

  update: sinon.stub(),

  insert: function (aSeries) {
    this.series.push(aSeries);
  },
};
MeetingSeriesSchema.getCollection = (_) => MeetingSeriesSchema;

const { MigrateV5 } = proxyquire("../../../../server/migrations/migrate_v5", {
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
});

describe("Migrate Version 5", () => {
  let series, minute, topicOfMinute, topicOfSeries, openTopic;

  beforeEach(() => {
    topicOfMinute = {
      subject: "Topic Subject",
      isOpen: true,
      isNew: true,
      infoItems: [],
    };

    openTopic = JSON.parse(JSON.stringify(topicOfMinute)); // clone topic
    topicOfSeries = JSON.parse(JSON.stringify(topicOfMinute)); // clone topic

    minute = { _id: "AaBbCc01", topics: [topicOfMinute] };

    series = {
      _id: "AaBbCc02",
      topics: [topicOfSeries],
      openTopics: [openTopic],
    };

    MinutesSchema.insert(minute);
    MeetingSeriesSchema.insert(series);
  });

  afterEach(() => {
    MinutesSchema.update.resetHistory();
    MeetingSeriesSchema.update.resetHistory();
    MeetingSeriesSchema.series = [];
    MinutesSchema.minutes = [];
  });

  describe("#up", () => {
    it("adds the isRecurring flag for each topic in minutes collection", () => {
      MigrateV5.up();

      expect(minute.topics[0].isRecurring, "isRecurring flag should be added")
        .to.be.false;
      expect(
        MinutesSchema.update.calledOnce,
        "MinutesSchema.update should be called once",
      ).to.be.true;
    });

    it("adds the isRecurring flag for each topic in meeting series collection", () => {
      MigrateV5.up();

      expect(
        series.openTopics[0].isRecurring,
        "isRecurring flag should be added of the topics in the openTopics array",
      ).to.be.false;
      expect(
        series.topics[0].isRecurring,
        "isRecurring flag should be added of the topics in the topics array",
      ).to.be.false;
      expect(
        MinutesSchema.update.calledOnce,
        "MinutesSchema.update should be called once",
      ).to.be.true;
    });
  });

  describe("#down", () => {
    beforeEach("add isRecurring property for each topic", () => {
      minute.topics[0].isRecurring = true;
      series.topics[0].isRecurring = false;
      series.openTopics[0].isRecurring = true;
    });

    it("removes the isRecurring flag for each topic in minutes collection", () => {
      MigrateV5.down();

      expect(minute.topics[0].isRecurring, "isRecurring flag should be removed")
        .to.be.undefined;
      expect(
        MinutesSchema.update.calledOnce,
        "MinutesSchema.update should be called once",
      ).to.be.true;
    });

    it("removes the isRecurring flag for each topic in meeting series collection", () => {
      MigrateV5.down();

      expect(
        series.openTopics[0].isRecurring,
        "isRecurring flag should be removed from the topics in the openTopics array",
      ).to.be.undefined;
      expect(
        series.topics[0].isRecurring,
        "isRecurring flag should be removed from the topics in the topics array",
      ).to.be.undefined;
      expect(
        MeetingSeriesSchema.update.calledOnce,
        "MeetingSeriesSchema.update should be called once",
      ).to.be.true;
    });
  });
});
