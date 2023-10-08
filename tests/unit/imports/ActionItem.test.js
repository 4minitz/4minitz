import { expect } from "chai";
import * as Helpers from "../../../imports/helpers/date";
import sinon from "sinon";
import proxyquire from "proxyquire";
import _ from "underscore";

const doNothing = () => {};

const Topic = {};
const Label = {};

class MeteorError {}

const Meteor = {
  call: sinon.stub(),
  Error: MeteorError,
  user: () => {
    return { username: "unit-test" };
  },
};

Helpers["@noCallThru"] = true;

const Random = { id: () => {} };

const i18n = {
  setLocale: sinon.stub(),
  getLocale: sinon.stub(),
  __: sinon.stub(),
};

const { Priority } = proxyquire("../../../imports/priority", {
  "meteor/universe:i18n": { i18n, "@noCallThru": true },
});

const { InfoItem } = proxyquire("../../../imports/infoitem", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "meteor/random": { Random, "@noCallThru": true },
  "/imports/user": { null: null, "@noCallThru": true },
  "meteor/underscore": { _, "@noCallThru": true },
  "/imports/helpers/date": Helpers,
  "./topic": { Topic, "@noCallThru": true },
  "./label": { Label, "@noCallThru": true },
});

const { ActionItem } = proxyquire("../../../imports/actionitem", {
  "meteor/meteor": { Meteor, "@noCallThru": true },
  "/imports/priority": { Priority, "@noCallThru": true },
  "./infoitem": { InfoItem, "@noCallThru": true },
});

describe("ActionItem", () => {
  let dummyTopic, infoItemDoc;

  beforeEach(() => {
    dummyTopic = {
      _id: "AaBbCcDd",
      save: doNothing,
      findInfoItem: doNothing,
    };

    infoItemDoc = {
      _id: "AaBbCcDd01",
      createdInMinute: "AaBbCcDd01",
      subject: "infoItemDoc",
      createdAt: new Date(),
      details: [
        {
          date: "2016-05-06",
          text: "details Text",
        },
      ],
    };
  });

  describe("#constructor", () => {
    it("sets the reference to the parent topic correctly", () => {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

      // the infoItem should have a reference of our dummyTopic
      expect(myActionItem._parentTopic).to.equal(dummyTopic);
    });

    it("sets the document correctly", () => {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);
      // the doc should be equal to our initial document
      expect(myActionItem._infoItemDoc).to.deep.equal(infoItemDoc);
    });

    it("sets the initial value for the isOpen-flag correctly", () => {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);
      // the isOpen-filed should be initially true for a new actionItem
      expect(myActionItem._infoItemDoc.isOpen).to.be.true;
    });

    it("sets the initial value for the isNew-flag correctly", () => {
      const myActionItem = new ActionItem(dummyTopic, infoItemDoc);
      // the isOpen-filed should be initially true for a new actionItem
      expect(myActionItem._infoItemDoc.isNew).to.be.true;
    });
  });

  it("#getDateFromDetails", () => {
    const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

    expect(myActionItem.getDateFromDetails()).to.equal(
      infoItemDoc.details[0].date,
    );
  });

  it("#getTextFromDetails", () => {
    const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

    expect(myActionItem.getTextFromDetails()).to.equal(
      infoItemDoc.details[0].text,
    );
  });

  it("#toggleState", () => {
    const myActionItem = new ActionItem(dummyTopic, infoItemDoc);

    const oldState = myActionItem._infoItemDoc.isOpen;

    myActionItem.toggleState();

    // state should have changed
    expect(myActionItem._infoItemDoc.isOpen).to.not.equal(oldState);
  });
});
