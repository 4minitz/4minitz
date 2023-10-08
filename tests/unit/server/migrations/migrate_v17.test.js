import { expect } from "chai";
import proxyquire from "proxyquire";

const MeetingSeriesSchema = {
  update: (id, doc) => {
    const meetingSeries = MeetingSeriesSchema.getCollection()
      .find()
      .find((series) => series._id === id);
    if (Object.prototype.hasOwnProperty.call(doc, "$set")) {
      // called by migrate-up
      meetingSeries.lastMinutesFinalized = doc.$set.lastMinutesFinalized;
      meetingSeries.lastMinutesId = doc.$set.lastMinutesId;
    } else {
      // called by migrate-down (unset)
      delete meetingSeries.lastMinutesFinalized;
      delete meetingSeries.lastMinutesId;
    }
  },
};
MeetingSeriesSchema.getCollection = (_) => MeetingSeriesSchema;

class MeteorError {}
const Meteor = {
  Error: MeteorError,
};

const MinutesFinder = {
  lastMinutesOfMeetingSeries(meetingSeries) {
    if (meetingSeries.hasMinute) {
      return {
        isFinalized: meetingSeries.lastMinuteIsFinalized,
        _id: "MIN_ID",
      };
    }
    return undefined;
  },
};

let firstFakeMeetingSeries, sndFakeMeetingSeries, thirdFakeMeetingSeries;
MeetingSeriesSchema.find = () => {
  return [firstFakeMeetingSeries, sndFakeMeetingSeries, thirdFakeMeetingSeries];
};

const { MigrateV17 } = proxyquire("../../../../server/migrations/migrate_v17", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/collections/meetingseries.schema": {
    MeetingSeriesSchema,
    "@noCallThru": true,
  },
  "/imports/services/minutesFinder": { MinutesFinder, "@noCallThru": true },
});

describe("Migrate Version 17", () => {
  beforeEach(() => {
    firstFakeMeetingSeries = {
      _id: "MS001",
      hasMinute: true,
      lastMinuteIsFinalized: true,
    };

    sndFakeMeetingSeries = {
      _id: "MS002",
      hasMinute: true,
      lastMinuteIsFinalized: true,
    };

    thirdFakeMeetingSeries = {
      _id: "MS003",
      hasMinute: false,
    };
  });

  describe("#up", () => {
    it("adds new fields to all meetingseries correctly", () => {
      MigrateV17.up();
      MeetingSeriesSchema.find().forEach((meetingSeries) => {
        const expectedMinuteId = meetingSeries.hasMinute ? "MIN_ID" : null;
        const expectedMinuteStatus =
          meetingSeries.hasMinute && meetingSeries.lastMinuteIsFinalized
            ? true
            : false;

        expect(meetingSeries.lastMinutesId).to.equal(expectedMinuteId);
        expect(meetingSeries.lastMinutesFinalized).to.equal(
          expectedMinuteStatus,
        );
      });
    });
  });

  describe("#down", () => {
    beforeEach(() => {
      MeetingSeriesSchema.find().forEach((meetingSeries) => {
        meetingSeries.lastMinutesFinalized = true;
        meetingSeries.lastMinutesId = "MIN_ID";
      });
    });

    it("removes the fields in all Meeting Series", () => {
      MigrateV17.down();
      MeetingSeriesSchema.find().forEach((meetingSeries) => {
        expect(meetingSeries).not.have.ownProperty("lastMinutesFinalized");
        expect(meetingSeries).not.have.ownProperty("lastMinutesId");
      });
    });
  });
});
