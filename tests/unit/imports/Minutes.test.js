import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import _ from "underscore";

import * as Helpers from "../../../imports/helpers/date";
import * as EmailHelpers from "../../../imports/helpers/email";
import * as SubElements from "../../../imports/helpers/subElements";

const MinutesSchema = {
  find: sinon.stub(),
  findOne: sinon.stub(),
};

MinutesSchema.getCollection = (_) => MinutesSchema;

class MeteorError {}

const Meteor = {
  call: sinon.stub(),
  callPromise: sinon.stub().resolves(true),
  Error: MeteorError,
};

const PromisedMethods = {};

const isCurrentUserModeratorStub = sinon.stub();
const updateLastMinutesFieldsStub = sinon.stub();
const updateLastMinutesFieldsAsyncStub = sinon.stub().resolves(true);
const MeetingSeries = function (seriesId) {
  this._id = seriesId;
  this.isCurrentUserModerator = isCurrentUserModeratorStub;
  this.updateLastMinutesFields = updateLastMinutesFieldsStub;
  this.updateLastMinutesFieldsAsync = updateLastMinutesFieldsAsyncStub;
};

const topicGetOpenActionItemsStub = sinon.stub().returns([]);
const Topic = function () {
  this.getOpenActionItems = topicGetOpenActionItemsStub;
};
Topic.hasOpenActionItem = () => {
  return false;
};

const ActionItem = function (topic, doc) {
  this._parentTopic = topic;
  this._infoItemDoc = doc;
};

SubElements["@noCallThru"] = true;
EmailHelpers["@noCallThru"] = true;
const Random = {
  id: () => {},
};
const { Minutes } = proxyquire("../../../imports/minutes", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "meteor/universe:i18n": { Meteor, "@noCallThru": true },
  "meteor/random": { Random, "@noCallThru": true },
  "./collections/minutes_private": { MinutesSchema, "@noCallThru": true },
  "./collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "./collections/workflow_private": { null: null, "@noCallThru": true },
  "./helpers/promisedMethods": { PromisedMethods, "@noCallThru": true },
  "./meetingseries": { MeetingSeries, "@noCallThru": true },
  "./topic": { Topic, "@noCallThru": true },
  "/imports/user": { null: null, "@noCallThru": true },
  "./actionitem": { ActionItem, "@noCallThru": true },
  "/imports/helpers/email": EmailHelpers,
  "/imports/helpers/subElements": SubElements,
  "meteor/underscore": { _, "@noCallThru": true },
});

describe("Minutes", () => {
  let minutesDoc, minute;

  beforeEach(() => {
    minutesDoc = {
      meetingSeries_id: "AaBbCc01",
      _id: "AaBbCc02",
      date: "2016-05-06",
      createdAt: new Date(),
      topics: [],
      isFinalized: false,
      participants: "",
      agenda: "",
    };

    minute = new Minutes(minutesDoc);
  });

  afterEach(() => {
    MinutesSchema.find.resetHistory();
    MinutesSchema.findOne.resetHistory();
    Meteor.call.resetHistory();
    Meteor.callPromise.resetHistory();
    isCurrentUserModeratorStub.resetHistory();
    updateLastMinutesFieldsStub.resetHistory();
    topicGetOpenActionItemsStub.resetHistory();
  });

  describe("#constructor", () => {
    it("sets the properties correctly", () => {
      expect(JSON.stringify(minute)).to.equal(JSON.stringify(minutesDoc));
    });

    it("fetches the minute from the database if the id was given", () => {
      new Minutes(minutesDoc._id);
      expect(MinutesSchema.findOne.calledOnce, "findOne should be called once")
        .to.be.true;
      expect(
        MinutesSchema.findOne.calledWith(minutesDoc._id),
        "findOne should be called with the id",
      ).to.be.true;
    });

    it("throws exception if constructor will be called without any arguments", () => {
      let exceptionThrown;
      try {
        new Minutes();
        exceptionThrown = false;
      } catch (e) {
        exceptionThrown = e instanceof MeteorError;
      }

      expect(exceptionThrown).to.be.true;
    });
  });

  describe("find", () => {
    it("#find", () => {
      Minutes.find("myArg");
      expect(MinutesSchema.find.calledOnce, "find-Method should be called once")
        .to.be.true;
      expect(
        MinutesSchema.find.calledWithExactly("myArg"),
        "arguments should be passed",
      ).to.be.true;
    });

    it("#findOne", () => {
      Minutes.findOne("myArg");
      expect(
        MinutesSchema.findOne.calledOnce,
        "findOne-Method should be called once",
      ).to.be.true;
      expect(
        MinutesSchema.findOne.calledWithExactly("myArg"),
        "arguments should be passed",
      ).to.be.true;
    });

    describe("#findAllIn", () => {
      let minIdArray;
      let limit;

      beforeEach(() => {
        minIdArray = ["1", "2"];
        limit = 3;
      });

      it("calls the find-Method of the Collection", () => {
        Minutes.findAllIn(minIdArray, limit);
        expect(
          MinutesSchema.find.calledOnce,
          "find-Method should be called once",
        ).to.be.true;
      });

      it("sets the id selector correctly", () => {
        Minutes.findAllIn(minIdArray, limit);
        const selector = MinutesSchema.find.getCall(0).args[0];
        expect(selector, "Selector has the property _id").to.have.ownProperty(
          "_id",
        );
        expect(
          selector._id,
          "_id-selector has propery $in",
        ).to.have.ownProperty("$in");
        expect(selector._id.$in, "idArray should be passed").to.deep.equal(
          minIdArray,
        );
      });

      it("sets the option correctly (sort, no limit)", () => {
        const expectedOption = { sort: { date: -1 } };
        Minutes.findAllIn(minIdArray);
        const options = MinutesSchema.find.getCall(0).args[1];
        expect(options).to.deep.equal(expectedOption);
      });

      it("sets the option correctly (sort and limit)", () => {
        const expectedOption = { sort: { date: -1 }, limit };
        Minutes.findAllIn(minIdArray, limit);
        const options = MinutesSchema.find.getCall(0).args[1];
        expect(options).to.deep.equal(expectedOption);
      });
    });
  });

  describe("#remove", () => {
    it("calls the meteor method minutes.remove", () => {
      Minutes.remove(minute._id);
      expect(Meteor.callPromise.calledOnce).to.be.true;
    });

    it("sends the minutes id to the meteor method minutes.remove", () => {
      Minutes.remove(minute._id);
      expect(
        Meteor.callPromise.calledWithExactly(
          "workflow.removeMinute",
          minute._id,
        ),
      ).to.be.true;
    });
  });

  describe("#syncVisibilityAndParticipants", () => {
    let visibleForArray, parentSeriesId;

    beforeEach(() => {
      visibleForArray = ["1", "2"];
      parentSeriesId = minute.meetingSeries_id;
    });

    it("calls the meteor method minutes.syncVisibilityAndParticipants", () => {
      Minutes.syncVisibility(parentSeriesId, visibleForArray);
      expect(Meteor.callPromise.calledOnce).to.be.true;
    });

    it("sends the parentSeriesId and the visibleFor-array to the meteor method minutes.syncVisibilityAndParticipants", () => {
      Minutes.syncVisibility(parentSeriesId, visibleForArray);
      expect(
        Meteor.callPromise.calledWithExactly(
          "minutes.syncVisibilityAndParticipants",
          parentSeriesId,
          visibleForArray,
        ),
      ).to.be.true;
    });
  });

  describe("#update", () => {
    let updateDocPart;

    beforeEach(() => {
      updateDocPart = {
        date: "2016-05-07",
      };
    });

    it("calls the meteor method minutes.update", () => {
      minute.update(updateDocPart);
      expect(Meteor.callPromise.calledOnce).to.be.true;
    });

    it("sends the doc part and the minutes id to the meteor method minutes.update", () => {
      minute.update(updateDocPart);
      const sentObj = JSON.parse(JSON.stringify(updateDocPart));
      sentObj._id = minute._id;
      expect(
        Meteor.callPromise.calledWithExactly(
          "minutes.update",
          sentObj,
          undefined,
        ),
      ).to.be.true;
    });

    it("updates the changed property of the minute object", async function () {
      await minute.update(updateDocPart);
      expect(minute.date).to.equal(updateDocPart.date);
    });
  });

  describe("#save", () => {
    it("calls the meteor method minutes.insert if a new minute will be saved", () => {
      delete minute._id;
      minute.save();
      expect(Meteor.call.calledOnce).to.be.true;
    });

    it("uses the workflow.addMinutes method to save a new minutes document", () => {
      delete minute._id;
      minute.save();
      expect(
        Meteor.call.calledWithExactly(
          "workflow.addMinutes",
          minute,
          undefined,
          undefined,
        ),
      ).to.be.true;
    });

    it("sets the createdAt-property if it is not set", () => {
      delete minute._id;
      delete minute.createdAt;
      minute.save();
      expect(minute).to.have.ownProperty("createdAt");
    });

    it("calls the meteor method minutes.update if a existing minute will be saved", () => {
      minute.save();
      expect(Meteor.call.calledOnce).to.be.true;
    });

    it("sends the minutes object to the meteor method minutes.update", () => {
      minute.save();
      expect(Meteor.call.calledWithExactly("minutes.update", minute)).to.be
        .true;
    });
  });

  it("#parentMeetingSeries", () => {
    const parentSeries = minute.parentMeetingSeries();
    expect(
      parentSeries instanceof MeetingSeries,
      "result should be an instance of MeetingSeries",
    ).to.be.true;
    expect(
      parentSeries._id,
      "created meeting series object should have the correct series id",
    ).to.equal(minute.meetingSeries_id);
  });

  it("#parentMeetingSeriesID", () => {
    expect(minute.parentMeetingSeriesID()).to.equal(minute.meetingSeries_id);
  });

  describe("topic related methods", () => {
    let topic1, topic2, topic3, topic4;

    beforeEach(() => {
      topic1 = {
        _id: "01",
        subject: "firstTopic",
        isNew: true,
        isOpen: true,
      };
      topic2 = {
        _id: "02",
        subject: "2ndTopic",
        isNew: true,
        isOpen: false,
      };
      topic3 = {
        _id: "03",
        subject: "3rdTopic",
        isNew: false,
        isOpen: true,
      };
      topic4 = {
        _id: "04",
        subject: "4thTopic",
        isNew: false,
        isOpen: false,
      };
      minute.topics.push(topic1);
      minute.topics.push(topic2);
      minute.topics.push(topic3);
      minute.topics.push(topic4);
    });

    describe("#findTopic", () => {
      it("finds the correct topic identified by its id", () => {
        expect(minute.findTopic(topic1._id)).to.deep.equal(topic1);
      });

      it("returns undefined if topic was not found", () => {
        expect(minute.findTopic("unknownId")).to.be.undefined;
      });
    });

    describe("#removeTopic", () => {
      it("removes the topic from the topics array", () => {
        const oldLength = minute.topics.length;
        minute.removeTopic(topic1._id);
        expect(minute.topics).to.have.length(oldLength - 1);
      });

      it("calls the meteor method minutes.update", () => {
        minute.removeTopic(topic1._id);
        expect(Meteor.callPromise.calledOnce).to.be.true;
      });
    });

    describe("#getNewTopics", () => {
      it("returns the correct amount of topics", () => {
        expect(minute.getNewTopics()).to.have.length(2);
      });

      it("returns only new topics", () => {
        const newTopics = minute.getNewTopics();
        newTopics.forEach((topic) => {
          expect(topic.isNew, "isNew-flag should be set").to.be.true;
        });
      });
    });

    describe("#getOldClosedTopics", () => {
      it("returns the correct amount of topics", () => {
        expect(minute.getOldClosedTopics()).to.have.length(1);
      });

      it("returns only old and closed topics", () => {
        const oldClosedTopics = minute.getOldClosedTopics();
        oldClosedTopics.forEach((topic) => {
          expect(
            topic.isNew && topic.isOpen,
            "isNew and isOpen flag should both not set",
          ).to.be.false;
        });
      });
    });

    describe("#getOpenActionItems", () => {
      it("calls the getOpenActionItems method for each topic", () => {
        minute.getOpenActionItems();
        expect(topicGetOpenActionItemsStub.callCount).to.equal(
          minute.topics.length,
        );
      });

      it("concatenates all results of each getOpenActionItems-call", () => {
        topicGetOpenActionItemsStub.returns([5, 7]);
        expect(minute.getOpenActionItems()).to.have.length(
          minute.topics.length * 2,
        );
      });
    });
  });

  describe("#upsertTopic", () => {
    let topicDoc;

    beforeEach(() => {
      topicDoc = {
        subject: "myTopic",
      };
    });

    it("adds a new topic to the topic array", () => {
      minute.upsertTopic(topicDoc);
      expect(Meteor.callPromise.calledOnce).to.be.true;
      expect(
        Meteor.callPromise.calledWithExactly(
          "minutes.addTopic",
          sinon.match.string,
          topicDoc,
        ),
      );
    });

    it("adds a new topic which already has an id", () => {
      topicDoc._id = "myId";
      minute.upsertTopic(topicDoc);
      expect(Meteor.callPromise.calledOnce).to.be.true;
      expect(
        Meteor.callPromise.calledWithExactly(
          "minutes.addTopic",
          topicDoc._id,
          topicDoc,
        ),
      );
    });

    it("updates an existing topic correctly", () => {
      topicDoc._id = "myId";
      minute.topics.unshift(topicDoc);
      topicDoc.subject = "changedSubject";
      minute.upsertTopic(topicDoc);
      expect(
        minute.topics,
        "update an existing topic should not change the size of the topics array",
      ).to.have.length(1);
      expect(
        minute.topics[0].subject,
        "the subject should have been updated",
      ).to.equal(topicDoc.subject);
    });

    it("calls the meteor method minutes.update", () => {
      minute.upsertTopic(topicDoc);
      expect(Meteor.callPromise.calledOnce).to.be.true;
    });

    it("sends the minutes id and the topic doc to the meteor method minutes.addTopic", () => {
      minute.upsertTopic(topicDoc);
      const callArgs = Meteor.callPromise.getCall(0).args;
      expect(
        callArgs[0],
        "first argument should be the name of the meteor method",
        "minutes.addTopic",
      );
      const sentDoc = callArgs[1];
      expect(
        callArgs[1],
        "minutes id should be sent to the meteor method",
      ).to.equal(minutesDoc._id);
      expect(
        callArgs[2],
        "topic-doc should be sent to the meteor method",
      ).to.equal(topicDoc);
    });
  });

  it("#isCurrentUserModerator", () => {
    minute.isCurrentUserModerator();

    expect(isCurrentUserModeratorStub.calledOnce).to.be.true;
  });
});
