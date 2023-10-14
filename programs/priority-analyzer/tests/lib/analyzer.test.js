import { Analyzer } from "../../lib/analyzer";

const expect = require("chai").expect;

describe("Analyzer", () => {
  it("adds the priority in upper case of the items to its token map", () => {
    const analyzer = new Analyzer();
    const item = { priority: "high" };
    analyzer.analyseActionItem(item);
    expect(analyzer.tokens).to.have.ownProperty("HIGH");
  });

  it("increments the token counter if a second element with the same priority is added (case-insensitive)", () => {
    const analyzer = new Analyzer();
    const item_1 = { priority: "high" };
    const item_2 = { priority: "HIGH" };
    analyzer.analyseActionItem(item_1);
    analyzer.analyseActionItem(item_2);
    expect(analyzer.tokens.HIGH.counter).to.equal(2);
  });
});
