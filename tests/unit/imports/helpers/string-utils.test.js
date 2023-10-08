import { expect } from "chai";
import { StringUtils } from "../../../../imports/helpers/string-utils";

describe("StringUtils", () => {
  describe("#eraseSubstring", () => {
    it("removes the substring which has both a leading and following blank and leaves just a single blank", () => {
      const string = "foo remove-it bar";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("foo bar");
    });

    it("removes the substring which is at the end of the string and has no following blank", () => {
      const string = "foo remove-it";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("foo");
    });

    it("removes the substring which is at the start of the string and has no leading blank", () => {
      const string = "remove-it bar";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("bar");
    });

    it("returns an empty string if string and substring are equal", () => {
      const string = "remove-it";
      const cleanedString = StringUtils.eraseSubstring(string, "remove-it");
      expect(cleanedString).to.equal("");
    });
  });
});
