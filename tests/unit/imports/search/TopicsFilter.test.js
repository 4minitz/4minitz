import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import _ from "underscore";

class MeteorError {}
const Meteor = {
  Error: MeteorError,
};

const { ITEM_KEYWORDS } = proxyquire(
  "../../../../imports/search/FilterKeywords",
  {
    "meteor/underscore": { _, "@noCallThru": true },
  },
);

const { TOPIC_KEYWORDS } = proxyquire(
  "../../../../imports/search/FilterKeywords",
  {
    "meteor/underscore": { _, "@noCallThru": true },
  },
);

const { ItemsFilter } = proxyquire("../../../../imports/search/ItemsFilter", {
  "meteor/underscore": { _, "@noCallThru": true },
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "./FilterKeywords": { ITEM_KEYWORDS, "@noCallThru": true },
});

const { TopicsFilter } = proxyquire("../../../../imports/search/TopicsFilter", {
  "meteor/underscore": { _, "@noCallThru": true },
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "./FilterKeywords": { TOPIC_KEYWORDS, "@noCallThru": true },
  "./ItemsFilter": { ItemsFilter, "@noCallThru": true },
});

import { QueryParserMock } from "./QueryParserMock";

describe("ItemsFilter", () => {
  let topics;
  let topicsFilter;
  let parser;

  beforeEach(() => {
    parser = new QueryParserMock();
    topicsFilter = new TopicsFilter();
    topics = [
      {
        subject: "One",
        infoItems: [
          { subject: "one.one", labels: ["L2", "L1"] },
          { subject: "one.two", labels: [] },
        ],
      },
      {
        subject: "Two",
        infoItems: [
          { subject: "two.one", labels: ["L1"] },
          { subject: "two.two", labels: [] },
          { subject: "two.three", labels: ["L1"] },
        ],
      },
      {
        subject: "Three",
        infoItems: [
          { subject: "three.one", labels: ["L3"] },
          { subject: "three.two", labels: [] },
          { subject: "three.three", labels: [] },
          { subject: "three.four", labels: [] },
        ],
      },
    ];
  });

  it("does not change the original array of items", () => {
    parser.searchTokens.push("three");
    topicsFilter.filter(topics, parser);

    expect(topics, "Length of the topic array should be 3").have.length(3);
    expect(
      topics[0].infoItems,
      "The first topic should contain two info items",
    ).to.have.length(2);
    expect(
      topics[1].infoItems,
      "The 2nd topic should contain three info items",
    ).to.have.length(3);
    expect(
      topics[2].infoItems,
      "The 3rd topic should contain four info items",
    ).to.have.length(4);
  });

  it("searches for a search tokens in topic subject and containing info items", () => {
    parser.searchTokens.push(".three");
    parser.searchTokens.push("Three");
    parser.caseSensitive = true;
    const res = topicsFilter.filter(topics, parser);
    parser.caseSensitive = false;

    expect(res, "Length of the topic array should be 1").have.length(1);
    expect(
      res[0].infoItems,
      "The resulting topic should contain all its items",
    ).to.have.length(4);
  });

  it("filters topics which has items with a specific label", () => {
    parser.labelTokens.push("L1");
    const res = topicsFilter.filter(topics, parser);
    expect(res, "Length of the topic array should be 2").have.length(2);
    expect(
      res[0].infoItems,
      "The resulting first topic should contain all its items",
    ).to.have.length(2);
    expect(
      res[1].infoItems,
      "The resulting snd topic should contain all its items",
    ).to.have.length(3);
  });
});
