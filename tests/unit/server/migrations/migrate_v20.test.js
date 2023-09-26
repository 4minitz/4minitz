import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";

const FIRST_MIN_ID = "#Min01";
const SND_MIN_ID = "#Min02";

let MinutesSchema = { update: sinon.stub() };
MinutesSchema.getCollection = (_) => MinutesSchema;

let TopicSchema = { update: sinon.stub() };
TopicSchema.getCollection = (_) => TopicSchema;

class MeteorError {}
let Meteor = { Error: MeteorError };

const Random = {
  i: 1,
  id: function () {
    return this.i++;
  },
};

const { MigrateV20 } = proxyquire("../../../../server/migrations/migrate_v20", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "meteor/random": { Random, "@noCallThru": true },
  "/imports/collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
  "/imports/collections/topic.schema": { TopicSchema, "@noCallThru": true },
});

describe("Migrate Version 20", function () {
  let firstFakeMinute, sndFakeMinute, fakeTopic;

  beforeEach(function () {
    firstFakeMinute = {
      _id: FIRST_MIN_ID,
      topics: [
        {
          _id: "#T01",
          infoItems: [
            {
              _id: "#I01",
              details: [{ text: "d1", createdInMinute: FIRST_MIN_ID }],
            },
            {
              _id: "#I02",
              details: [
                { text: "d2", createdInMinute: FIRST_MIN_ID },
                { text: "d3", createdInMinute: FIRST_MIN_ID },
              ],
            },
          ],
        },
        {
          _id: "#T02",
          infoItems: [
            {
              _id: "#I03",
              details: [{ text: "d4", createdInMinute: FIRST_MIN_ID }],
            },
            { _id: "#I04" },
          ],
        },
      ],
    };
    sndFakeMinute = {
      _id: SND_MIN_ID,
      topics: [
        {
          _id: "#T01",
          infoItems: [
            {
              _id: "#I01",
              details: [
                { text: "d1", createdInMinute: FIRST_MIN_ID },
                { text: "d2", createdInMinute: SND_MIN_ID },
              ],
            },
          ],
        },
      ],
    };

    fakeTopic = {
      _id: "#T01",
      infoItems: [{ _id: "I01", details: [{ text: "d1" }, { text: "d2" }] }],
    };

    MinutesSchema.find = () => {
      return [firstFakeMinute, sndFakeMinute];
    };

    TopicSchema.find = () => {
      return [fakeTopic];
    };
  });

  afterEach(function () {
    MinutesSchema.update.resetHistory();
    TopicSchema.update.resetHistory();
  });

  describe("#up", function () {
    let checkDetailHasProperty = (detail) => {
      expect(detail).to.have.ownProperty("isNew");
    };

    it("adds new field to all topics in topicCollection", function () {
      MigrateV20.up();
      fakeTopic.infoItems.forEach((infoItem) => {
        if (infoItem.details) {
          infoItem.details.forEach(checkDetailHasProperty);
        }
      });
    });

    it("adds new field to all topics in minutes", function () {
      MigrateV20.up();
      firstFakeMinute.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasProperty);
          }
        });
      });

      sndFakeMinute.topics.forEach((topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasProperty);
          }
        });
      });
    });

    // only checks minutes because topic collection will be overriden with next
    // finalize anyways
    it("sets the correct isNew-attribute for all details in minutes", function () {
      MigrateV20.up();
      expect(firstFakeMinute.topics[0].infoItems[0].details[0].isNew).to.equal(
        true,
      );
      expect(firstFakeMinute.topics[0].infoItems[1].details[0].isNew).to.equal(
        true,
      );
      expect(firstFakeMinute.topics[0].infoItems[1].details[1].isNew).to.equal(
        true,
      );
      expect(firstFakeMinute.topics[1].infoItems[0].details[0].isNew).to.equal(
        true,
      );

      expect(sndFakeMinute.topics[0].infoItems[0].details[0].isNew).to.equal(
        false,
      );
      expect(sndFakeMinute.topics[0].infoItems[0].details[1].isNew).to.equal(
        true,
      );
    });
  });

  describe("#down", function () {
    beforeEach(function () {
      let addIsNewToDetail = (topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach((detail) => {
              detail.isNew = true;
            });
          }
        });
      };
      firstFakeMinute.topics.forEach(addIsNewToDetail);
      sndFakeMinute.topics.forEach(addIsNewToDetail);
      addIsNewToDetail(fakeTopic);
    });

    it("removes the isNew attribute", function () {
      MigrateV20.down();
      let checkDetailHasNoProperty = (detail) => {
        expect(detail).not.have.ownProperty("isNew");
      };

      let checkTopics = (topic) => {
        topic.infoItems.forEach((infoItem) => {
          if (infoItem.details) {
            infoItem.details.forEach(checkDetailHasNoProperty);
          }
        });
      };

      firstFakeMinute.topics.forEach(checkTopics);
      sndFakeMinute.topics.forEach(checkTopics);
      checkTopics(fakeTopic);

      fakeTopic.infoItems.forEach((infoItem) => {
        if (infoItem.details) {
          infoItem.details.forEach(checkDetailHasNoProperty);
        }
      });
    });
  });
});
