// TODO: This migrate_v4 unit test actually does nothing.
// Its just a quick fix that prohibits a test exception during other migration
// tests

import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

require("../../../../imports/helpers/date");

const MinutesSchema = {
  find: sinon.stub(),
  update: sinon.stub(),
};
MinutesSchema.getCollection = () => MinutesSchema;

const MeetingSeriesSchema = {
  find: sinon.stub(),
  update: sinon.stub(),
};
MeetingSeriesSchema.getCollection = () => MeetingSeriesSchema;

const { MigrateV4 } = proxyquire("../../../../server/migrations/migrate_v4", {
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
});

describe("MigrateV4", () => {
  const dummyResponsible = "I am responsible";
  let minutesDoc,
    topicDocWithResponsible,
    topicDocWithoutResponsible,
    meetingSeriesDoc,
    topicDocWithRespOfSeriesTopics,
    topicDocWithoutRespOfSeriesTopics,
    topicDocWithRespOfSeriesOpenTopics,
    topicDocWithoutRespOfSeriesOpenTopics;
  let topicsWithResponsible, topicWithoutResponsible;

  beforeEach(() => {
    let nextId = 0;
    const createTopicDoc = (withResponsible = true) => {
      nextId++;
      const doc = { _id: `topic#${nextId}` };
      if (withResponsible) {
        doc.responsible = dummyResponsible;
      }
      return doc;
    };

    topicDocWithoutResponsible = createTopicDoc(false);
    topicDocWithResponsible = createTopicDoc(true);
    minutesDoc = {
      _id: "min#1",
      topics: [topicDocWithoutResponsible, topicDocWithResponsible],
    };
    MinutesSchema.find.returns([minutesDoc]);

    topicDocWithoutRespOfSeriesOpenTopics = createTopicDoc(false);
    topicDocWithRespOfSeriesOpenTopics = createTopicDoc(true);
    topicDocWithoutRespOfSeriesTopics = createTopicDoc(false);
    topicDocWithRespOfSeriesTopics = createTopicDoc(true);
    meetingSeriesDoc = {
      _id: "series#1",
      topics: [
        topicDocWithoutRespOfSeriesTopics,
        topicDocWithRespOfSeriesTopics,
      ],
      openTopics: [
        topicDocWithoutRespOfSeriesOpenTopics,
        topicDocWithRespOfSeriesOpenTopics,
      ],
    };
    MeetingSeriesSchema.find.returns([meetingSeriesDoc]);

    topicsWithResponsible = [
      topicDocWithResponsible,
      topicDocWithRespOfSeriesTopics,
      topicDocWithRespOfSeriesOpenTopics,
    ];
    topicWithoutResponsible = [
      topicDocWithoutResponsible,
      topicDocWithoutRespOfSeriesTopics,
      topicDocWithoutRespOfSeriesOpenTopics,
    ];
  });

  afterEach(() => {
    MinutesSchema.find.reset();
    MinutesSchema.update.resetHistory();
    MeetingSeriesSchema.find.reset();
    MeetingSeriesSchema.update.resetHistory();
  });

  describe("#up", () => {
    it("converts the responsible string of each topics inside every minutes to an array containing the responsible", () => {
      MigrateV4.up();
      topicsWithResponsible.forEach((topicDoc) => {
        expect(topicDoc.responsibles).to.have.length(1);
      });
      topicWithoutResponsible.forEach((topicDoc) => {
        expect(topicDoc.responsibles).to.have.length(0);
      });
    });

    it("calls the update method of the minutes collection", () => {
      MigrateV4.up();
      expect(MinutesSchema.update.calledOnce).to.be.true;
    });

    it("sends the minutes id as selector to the update call on the minutes collection", () => {
      MigrateV4.up();
      expect(MinutesSchema.update.calledWith(minutesDoc._id)).to.be.true;
    });

    it("calls the update method of the meeting series collection", () => {
      MigrateV4.up();
      expect(MeetingSeriesSchema.update.calledOnce).to.be.true;
    });

    it("sends the series id as selector to the update call on the meeting series collection", () => {
      MigrateV4.up();
      expect(MeetingSeriesSchema.update.calledWith(meetingSeriesDoc._id)).to.be
        .true;
    });
  });

  describe("#down", () => {
    const expectedResponsibleString = "resp1,resp2";

    beforeEach(() => {
      topicsWithResponsible.forEach((topic) => {
        delete topic.responsible;
        topic.responsibles = ["resp1", "resp2"];
      });
    });

    it("removes the responsibles array and converts the array to a flat string", () => {
      MigrateV4.down();
      topicsWithResponsible.forEach((topic) => {
        expect(Object.prototype.hasOwnProperty.call(topic, "responsibles")).to
          .be.false;
        expect(topic.responsible).to.equal(expectedResponsibleString);
      });
    });

    it("calls the update method of the minutes collection", () => {
      MigrateV4.down();
      expect(MinutesSchema.update.calledOnce).to.be.true;
    });

    it("sends the minutes id as selector to the update call on the minutes collection", () => {
      MigrateV4.down();
      expect(MinutesSchema.update.calledWith(minutesDoc._id)).to.be.true;
    });

    it("calls the update method of the meeting series collection", () => {
      MigrateV4.down();
      expect(MeetingSeriesSchema.update.calledOnce).to.be.true;
    });

    it("sends the series id as selector to the update call on the meeting series collection", () => {
      MigrateV4.down();
      expect(MeetingSeriesSchema.update.calledWith(meetingSeriesDoc._id)).to.be
        .true;
    });
  });
});
