import { expect } from "chai";
import {
  formatDateISO8601,
  currentDatePlusDeltaDays,
  extractDateFromString,
} from "../../../../imports/helpers/date";

describe("formatDateISO8601 helper", () => {
  it("formats date to string", () => {
    expect(formatDateISO8601(new Date(2016, 11, 23))).to.equal("2016-12-23");
  });
});

describe("currentDatePlusDeltaDays helper", () => {
  it("works without parameter", () => {
    var currentDate = new Date();

    expect(currentDatePlusDeltaDays()).to.equal(formatDateISO8601(currentDate));
  });

  it("works with zero offset", () => {
    var currentDate = new Date();

    expect(currentDatePlusDeltaDays(0)).to.equal(
      formatDateISO8601(currentDate),
    );
  });

  it("works with positive offset", () => {
    var currentDate = new Date();
    var nextDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1,
    );

    expect(currentDatePlusDeltaDays(1)).to.equal(formatDateISO8601(nextDay));
  });

  it("works with negative offset", () => {
    var currentDate = new Date();
    var nextDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 35,
    );

    expect(currentDatePlusDeltaDays(-35)).to.equal(formatDateISO8601(nextDay));
  });
});

describe("extractDateFromString", () => {
  it("returns the extracted date", () => {
    const stringWithDate = "Hello 2017-11-13";
    const dateString = extractDateFromString(stringWithDate);
    expect(dateString).to.equal("2017-11-13");
  });
});
