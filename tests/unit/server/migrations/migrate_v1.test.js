import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

import * as Helpers from "../../../../imports/helpers/date";

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

Helpers["@noCallThru"] = true;

const { MigrateV1 } = proxyquire("../../../../server/migrations/migrate_v1", {
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/helpers/date": Helpers,
});

/**
 * Checks if the update method of the minutesCollection
 * was called with the correct arguments.
 *
 * @param minute
 * @param checkUpdatedTopic callback to verify that the topic
 *        was modified correctly.
 */
const checkUpdateMinuteCall = (minute, checkUpdatedTopic) => {
  expect(MinutesSchema.update.calledOnce).to.be.true;

  const updateCall = MinutesSchema.update.getCall(0);
  expect(updateCall.args[0]).to.equal(minute._id);

  const updateSetter = updateCall.args[1].$set;
  expect(Object.prototype.hasOwnProperty.call(updateSetter, "topics.0")).to.be
    .true;

  const updatedTopic = updateSetter["topics.0"];
  checkUpdatedTopic(updatedTopic);
};

/**
 * Checks if the update method of the meetingSeriesCollection
 * was called with the correct arguments.
 *
 * @param series
 * @param checkUpdatedTopic callback to verify that the topic
 *        was modified correctly.
 */
const checkUpdateMeetingSeriesCall = (series, checkUpdatedTopic) => {
  expect(MeetingSeriesSchema.update.callCount).to.equal(2);

  // first call on open topics
  const firstCall = MeetingSeriesSchema.update.getCall(0);
  expect(firstCall.args[0]).to.equal(series._id);

  const updateSetter1 = firstCall.args[1].$set;
  expect(Object.prototype.hasOwnProperty.call(updateSetter1, "openTopics.0")).to
    .be.true;

  const updTopic = updateSetter1["openTopics.0"];
  checkUpdatedTopic(updTopic);

  // second call on closed topics
  const sndCall = MeetingSeriesSchema.update.getCall(1);
  expect(sndCall.args[0]).to.equal(series._id);

  const updateSetter2 = sndCall.args[1].$set;
  expect(Object.prototype.hasOwnProperty.call(updateSetter2, "closedTopics.0"))
    .to.be.true;

  const updClosedTopic = updateSetter2["closedTopics.0"];
  checkUpdatedTopic(updClosedTopic);
};

describe("Migrate Version 1", () => {
  let series, minute, topic, closedTopic;

  beforeEach(() => {
    topic = {
      subject: "Topic Subject",
      responsible: "person",
      isOpen: true,
      isNew: true,
      priority: "High",
      duedate: "2009-05-06",
      details: [{ date: "2009-05-03", text: "" }],
    };

    closedTopic = JSON.parse(JSON.stringify(topic)); // clone topic
    closedTopic.isOpen = false;

    minute = { _id: "AaBbCc01", topics: [topic] };

    series = {
      _id: "AaBbCc02",
      openTopics: [topic],
      closedTopics: [closedTopic],
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
    const checkUpdatedTopic = (updatedTopic) => {
      expect(updatedTopic).to.not.have.ownProperty("details");
      expect(updatedTopic).to.not.have.ownProperty("duedate");
      expect(updatedTopic).to.not.have.ownProperty("priority");

      expect(updatedTopic).to.have.ownProperty("infoItems");
      expect(updatedTopic.infoItems).to.be.instanceof(Array);
      expect(updatedTopic.infoItems).to.be.empty;
    };

    it("modifies the topic of the minute in the minutes collection", () => {
      MigrateV1.up();

      checkUpdateMinuteCall(minute, checkUpdatedTopic);
    });

    it("modifies the open/closed topics of a series", () => {
      MigrateV1.up();

      checkUpdateMeetingSeriesCall(series, checkUpdatedTopic);
    });
  });

  describe("#down", () => {
    const checkUpdatedTopic = (updatedTopic) => {
      expect(updatedTopic).to.have.ownProperty("details");
      expect(updatedTopic).to.have.ownProperty("duedate");
      expect(updatedTopic).to.have.ownProperty("priority");

      expect(updatedTopic).to.not.have.ownProperty("infoItems");
    };

    it("modifies the topic of the minute in the minutes collection", () => {
      MigrateV1.down();

      checkUpdateMinuteCall(minute, checkUpdatedTopic);
    });

    it("modifies the open/closed topics of a series", () => {
      MigrateV1.down();

      checkUpdateMeetingSeriesCall(series, checkUpdatedTopic);
    });
  });
});
