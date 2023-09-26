import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

let MinutesSchema = {
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

let MeetingSeriesSchema = {
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

const { MigrateItemsPre16 } = proxyquire(
  "../../../../server/migrations/helpers/migrateItems",
  {
    "/imports/collections/minutes.schema": {
      MinutesSchema,
      "@noCallThru": true,
    },
    "/imports/collections/meetingseries.schema": {
      MeetingSeriesSchema,
      "@noCallThru": true,
    },
  },
);

const { MigrateV3 } = proxyquire("../../../../server/migrations/migrate_v3", {
  "./helpers/migrateItems": { MigrateItemsPre16, "@noCallThru": true },
});

describe("Migrate Version 3", function () {
  let series, minute, topicOfMinute, topicOfSeries, openTopic, infoItem;

  beforeEach(function () {
    infoItem = {
      _id: "AaBbCc0101",
      subject: "my info item",
      itemType: "infoItem",
      createdInMinute: "AaBbCc01",
    };

    topicOfMinute = {
      subject: "Topic Subject",
      isOpen: true,
      isNew: true,
      infoItems: [infoItem],
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

  afterEach(function () {
    MinutesSchema.update.resetHistory();
    MeetingSeriesSchema.update.resetHistory();
    MeetingSeriesSchema.series = [];
    MinutesSchema.minutes = [];
  });

  describe("#up", function () {
    it("adds the isSticky flag for each info item in minutes collection", function () {
      MigrateV3.up();

      expect(
        minute.topics[0].infoItems[0].isSticky,
        "isSticky flag should be added",
      ).to.be.false;
      expect(
        MinutesSchema.update.calledOnce,
        "MinutesSchema.update should be called once",
      ).to.be.true;
    });

    it("adds the isSticky flag for each info item in meeting series collection", function () {
      MigrateV3.up();

      expect(
        series.openTopics[0].infoItems[0].isSticky,
        "isSticky flag should be added of the infoItems in the openTopics array",
      ).to.be.false;
      expect(
        series.topics[0].infoItems[0].isSticky,
        "isSticky flag should be added of the infoItems in the topics array",
      ).to.be.false;
      expect(
        MinutesSchema.update.calledOnce,
        "MinutesSchema.update should be called once",
      ).to.be.true;
    });
  });

  describe("#down", function () {
    beforeEach("add isSticky property for each item", function () {
      minute.topics[0].infoItems[0].isSticky = true;
      series.topics[0].infoItems[0].isSticky = false;
      series.openTopics[0].infoItems[0].isSticky = true;
    });

    it("removes the isSticky flag for each info item in minutes collection", function () {
      MigrateV3.down();

      expect(
        minute.topics[0].infoItems[0].isSticky,
        "isSticky flag should be removed",
      ).to.be.undefined;
      expect(
        MinutesSchema.update.calledOnce,
        "MinutesSchema.update should be called once",
      ).to.be.true;
    });

    it("removes the isSticky flag for each info item in meeting series collection", function () {
      MigrateV3.down();

      expect(
        series.openTopics[0].infoItems[0].isSticky,
        "isSticky flag should be removed of the infoItems in the openTopics array",
      ).to.be.undefined;
      expect(
        series.topics[0].infoItems[0].isSticky,
        "isSticky flag should be removed of the infoItems in the topics array",
      ).to.be.undefined;
      expect(
        MeetingSeriesSchema.update.calledOnce,
        "MeetingSeriesSchema.update should be called once",
      ).to.be.true;
    });
  });
});
