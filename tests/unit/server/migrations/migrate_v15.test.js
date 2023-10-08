import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const DEFAULT_PRIORITY = 3;

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

const { MigrateV15 } = proxyquire("../../../../server/migrations/migrate_v15", {
  "./helpers/migrateItems": { MigrateItemsPre16, "@noCallThru": true },
});

describe("Migrate Version 15", () => {
  let series,
    minute,
    topicOfMinute,
    topicOfSeries,
    openTopic,
    actionItem1,
    actionItem2,
    actionItem3,
    actionItem4,
    infoItem,
    infoItem2;

  beforeEach(() => {
    infoItem = {
      _id: "AaBbCc0101",
      subject: "my info item",
      itemType: "infoItem",
    };
    actionItem1 = {
      _id: "AaBbCc0102",
      subject: "my first action item",
      itemType: "actionItem",
      priority: "high!",
    };
    actionItem2 = {
      _id: "AaBbCc0103",
      subject: "my second action item",
      itemType: "actionItem",
    };
    actionItem3 = {
      _id: "AaBbCc0104",
      subject: "my medium action item",
      itemType: "actionItem",
      priority: "medium",
    };
    actionItem4 = {
      _id: "AaBbCc0105",
      subject: "my low action item",
      itemType: "actionItem",
      priority: "low",
    };
    infoItem2 = {
      _id: "AaBbCc0106",
      subject: "my info item 2",
      itemType: "infoItem",
      priority: "",
    };

    topicOfMinute = {
      subject: "Topic Subject",
      isOpen: true,
      isNew: true,
      infoItems: [
        infoItem,
        actionItem1,
        actionItem2,
        actionItem3,
        actionItem4,
        infoItem2,
      ],
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

  const checkPriorities = (index, expectedValue) => {
    if (expectedValue === undefined) {
      expect(minute.topics[0].infoItems[index]).to.not.have.own.property(
        "priority",
      );
      expect(series.topics[0].infoItems[index]).to.not.have.own.property(
        "priority",
      );
      expect(series.openTopics[0].infoItems[index]).to.not.have.own.property(
        "priority",
      );
    }
    expect(minute.topics[0].infoItems[index].priority).to.equal(expectedValue);
    expect(series.topics[0].infoItems[index].priority).to.equal(expectedValue);
    expect(series.openTopics[0].infoItems[index].priority).to.equal(
      expectedValue,
    );
  };

  describe("#up", () => {
    it("does not change the info item", () => {
      MigrateV15.up();
      checkPriorities(0);
    });

    it("removes the priority property of an info item if it exists", () => {
      MigrateV15.up();
      checkPriorities(5);
    });

    it("converts the priority with value high to the corresponding number", () => {
      MigrateV15.up();
      checkPriorities(1, 1);
    });

    it("converts the priority with value medium to the corresponding number", () => {
      MigrateV15.up();
      checkPriorities(3, 3);
    });

    it("converts the priority with value low to the corresponding number", () => {
      MigrateV15.up();
      checkPriorities(4, 5);
    });

    it("sets the default value for an action item without priority", () => {
      MigrateV15.up();
      checkPriorities(2, DEFAULT_PRIORITY);
    });

    it("calls the update method on the MinutesSchema", () => {
      MigrateV15.up();
      expect(MinutesSchema.update.calledOnce).to.be.true;
    });

    it("calls the update method on the MeetingSeriesSchema", () => {
      MigrateV15.up();
      expect(MeetingSeriesSchema.update.calledOnce).to.be.true;
    });
  });

  describe("#down", () => {
    beforeEach("setup priority numbers for action items", () => {
      minute.topics[0].infoItems[1].priority = 1;
      minute.topics[0].infoItems[2].priority = DEFAULT_PRIORITY;
      series.topics[0].infoItems[1].priority = 1;
      series.topics[0].infoItems[2].priority = DEFAULT_PRIORITY;
      series.openTopics[0].infoItems[1].priority = 1;
      series.openTopics[0].infoItems[2].priority = DEFAULT_PRIORITY;
    });

    it("does not change the info item", () => {
      MigrateV15.down();
      checkPriorities(0);
    });

    it("converts the priority with a numeric value to a string value", () => {
      MigrateV15.down();
      checkPriorities(1, "1");
    });

    it("sets the default value for an action item without priority", () => {
      MigrateV15.down();
      checkPriorities(2, DEFAULT_PRIORITY.toString());
    });

    it("calls the update method on the MinutesSchema", () => {
      MigrateV15.down();
      expect(MinutesSchema.update.calledOnce).to.be.true;
    });

    it("calls the update method on the MeetingSeriesSchema", () => {
      MigrateV15.down();
      expect(MeetingSeriesSchema.update.calledOnce).to.be.true;
    });
  });
});
