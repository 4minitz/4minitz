const expect = require("chai").expect;

import { RangeHelper } from "../../lib/range-helper";

describe("RangeHelper", function () {
  describe("#convertRangeToMinMaxObject", function () {
    it("should return a min/max-object for input with the format <min-max>", function () {
      const result = RangeHelper.convertRangeToMinMaxObject("3-7", false);
      expect(result.min).to.equal(3);
      expect(result.max).to.equal(7);
    });

    it("should return a min/max-object for input with the format <number>", function () {
      const result = RangeHelper.convertRangeToMinMaxObject("5", false);
      expect(result.min).to.equal(5);
      expect(result.max).to.equal(5);
    });

    it("should return the fallbackObject for invalid input", function () {
      const result = RangeHelper.convertRangeToMinMaxObject("invalid", {
        min: 3,
        max: 7,
      });
      expect(result.min).to.equal(3);
      expect(result.max).to.equal(7);
    });
  });
});
