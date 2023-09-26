import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import _ from "underscore";

let MinutesSchema = {};
let Minutes = sinon.spy();

const { MinutesFinder } = proxyquire(
  "../../../../imports/services/minutesFinder",
  {
    "../collections/minutes.schema": { MinutesSchema, "@noCallThru": true },
    "../minutes": { Minutes, "@noCallThru": true },
  },
);

const clear = function (obj) {
  for (const key of Object.getOwnPropertyNames(obj)) {
    delete obj[key];
  }
};

const clearAll = function () {
  clear(MinutesSchema);
  Minutes.resetHistory();
};

describe("MinutesFinder", function () {
  beforeEach(clearAll);

  const FakeMinutes = [{ _id: "123" }, { _id: "abc" }],
    EmptyMinutesCollection = { find: sinon.stub().returns([]) },
    MinutesCollection = { find: sinon.stub().returns(FakeMinutes) };
  let MeetingSeries;

  const setupNonEmptySeries = function () {
    MinutesCollection.find.resetHistory();
    MinutesSchema.getCollection = (_) => MinutesCollection;

    MeetingSeries = { minutes: FakeMinutes.map((m) => m._id) };
  };

  const setupEmptySeries = function () {
    MinutesCollection.find.resetHistory();
    MinutesSchema.getCollection = (_) => EmptyMinutesCollection;

    MeetingSeries = { minutes: [] };
  };

  describe("#allMinutesOfMeetingSeries", function () {
    beforeEach(function () {
      setupNonEmptySeries();
    });

    it("returns all minutes of a meeting series", function () {
      let result = MinutesFinder.allMinutesOfMeetingSeries(MeetingSeries);

      // number of minutes found equals number of fake minutes
      const expectedLength = FakeMinutes.length;
      expect(result).to.have.lengthOf(expectedLength);

      // Minutes were instantiated
      FakeMinutes.forEach((m) => {
        expect(Minutes.calledWith(m)).to.be.true;
      });
    });

    it("default is to sort descending by date", function () {
      const result = MinutesFinder.allMinutesOfMeetingSeries(MeetingSeries);

      // expect the collection find() stub to be called with a limit config set
      const findStub = MinutesCollection.find;
      const expectedQuery = { _id: { $in: MeetingSeries.minutes } };
      const expectedOptions = { sort: { date: -1 } };
      expect(findStub.calledWith(expectedQuery, expectedOptions)).to.be.true;
    });

    it("returns all minutes up to the given limit", function () {
      const limitedNumberOfMinutes = 1;
      const result = MinutesFinder.allMinutesOfMeetingSeries(
        MeetingSeries,
        limitedNumberOfMinutes,
      );

      // expect the collection find() stub to be called with a limit config set
      const findStub = MinutesCollection.find;
      const expectedQuery = { _id: { $in: MeetingSeries.minutes } };
      const expectedOptions = {
        sort: { date: -1 },
        limit: limitedNumberOfMinutes,
      };
      expect(findStub.calledWith(expectedQuery, expectedOptions)).to.be.true;
    });

    it("sorts the minutes ascending if the sortDescending parameter is given as false", function () {
      const numberOfMinutes = FakeMinutes.length;
      const sortDescending = false;
      const result = MinutesFinder.allMinutesOfMeetingSeries(
        MeetingSeries,
        numberOfMinutes,
        sortDescending,
      );

      // expect the collection find() stub to be called with a limit config
      // set
      const findStub = MinutesCollection.find;
      const expectedQuery = { _id: { $in: MeetingSeries.minutes } };
      const expectedOptions = { sort: { date: 1 }, limit: numberOfMinutes };
      expect(findStub.calledWith(expectedQuery, expectedOptions)).to.be.true;
    });
  });

  describe("#firstMinutesOfMeetingSeries", function () {
    it("returns false for an empty series", function () {
      setupEmptySeries();

      const result = MinutesFinder.firstMinutesOfMeetingSeries(MeetingSeries);

      expect(result).to.be.false;
    });

    it("returns the first minutes for a non-empty series", function () {
      setupNonEmptySeries();
      MinutesCollection.find.returns(FakeMinutes.slice(0, 1));

      const result = MinutesFinder.firstMinutesOfMeetingSeries(MeetingSeries);

      expect(MinutesCollection.find.callCount).to.equal(1);

      const optionsArgument = MinutesCollection.find.lastCall.args[1];
      expect(optionsArgument.sort.date).to.equal(1);
    });
  });

  describe("#lastMinutesOfMeetingSeries", function () {
    it("returns false for an empty series", function () {
      setupEmptySeries();

      const result = MinutesFinder.firstMinutesOfMeetingSeries(MeetingSeries);

      expect(result).to.be.false;
    });

    it("returns the last minutes for a non-empty series", function () {
      setupNonEmptySeries();
      MinutesCollection.find.returns(FakeMinutes.slice(1));

      const result = MinutesFinder.lastMinutesOfMeetingSeries(MeetingSeries);

      expect(MinutesCollection.find.callCount).to.equal(1);

      const optionsArgument = MinutesCollection.find.lastCall.args[1];
      expect(optionsArgument.sort.date).to.equal(-1);
    });
  });

  describe("#secondLastMinutesOfMeetingSeries", function () {
    it("returns false for an empty series", function () {
      setupEmptySeries();

      const result =
        MinutesFinder.secondLastMinutesOfMeetingSeries(MeetingSeries);

      expect(result).to.be.false;
    });

    it("returns the second to last minutes for a non-empty series", function () {
      setupNonEmptySeries();

      const result =
        MinutesFinder.secondLastMinutesOfMeetingSeries(MeetingSeries);

      expect(MinutesCollection.find.callCount).to.equal(1);

      const optionsArgument = MinutesCollection.find.lastCall.args[1];
      expect(optionsArgument.sort.date).to.equal(-1);
      expect(optionsArgument.limit).to.equal(2);
    });
  });

  describe("#previousMinutes", function () {
    it("returns false for empty series", function () {
      setupEmptySeries();
      const minutes = { parentMeetingSeries: (_) => MeetingSeries };

      const result = MinutesFinder.previousMinutes(minutes);

      expect(result).to.be.false;
    });

    it("returns false for the first minutes of a series", function () {
      setupNonEmptySeries();
      const minutes = FakeMinutes.slice().shift();
      minutes.parentMeetingSeries = (_) => MeetingSeries;

      const result = MinutesFinder.previousMinutes(minutes);

      expect(result).to.be.false;
    });

    it("returns the previous minutes of a non-empty series", function () {
      setupNonEmptySeries();
      const minutes = FakeMinutes.slice().pop();
      minutes.parentMeetingSeries = (_) => MeetingSeries;

      const result = MinutesFinder.previousMinutes(minutes);
      expect(Minutes.callCount).to.equal(1);
      expect(Minutes.calledWith(FakeMinutes[0]._id)).to.be.true;
    });
  });

  describe("#nextMinutes", function () {
    it("returns false for empty series", function () {
      setupEmptySeries();
      const minutes = { parentMeetingSeries: (_) => MeetingSeries };

      const result = MinutesFinder.nextMinutes(minutes);

      expect(result).to.be.false;
    });

    it("returns false for the last minutes of a series", function () {
      setupNonEmptySeries();
      const minutes = FakeMinutes.slice().pop();
      minutes.parentMeetingSeries = (_) => MeetingSeries;

      const result = MinutesFinder.nextMinutes(minutes);

      expect(result).to.be.false;
    });

    it("returns the next minutes of a non-empty series", function () {
      setupNonEmptySeries();
      const minutes = FakeMinutes.slice().shift();
      minutes.parentMeetingSeries = (_) => MeetingSeries;

      const result = MinutesFinder.nextMinutes(minutes);
      expect(Minutes.callCount).to.equal(1);
      expect(Minutes.calledWith(FakeMinutes[1]._id)).to.be.true;
    });
  });
});
