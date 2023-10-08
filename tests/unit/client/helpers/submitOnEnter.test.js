import { expect } from "chai";
import proxyquire from "proxyquire";
import sinon from "sinon";
import _ from "underscore";

const jQueryOnStub = sinon.stub();
const $ = sinon.stub().returns({
  on: jQueryOnStub,
});

const submitOnEnter = proxyquire("../../../../client/helpers/submitOnEnter", {
  "meteor/jquery": { $, "@noCallThru": true },
  "meteor/underscore": { _, "@noCallThru": true },
}).default;

describe("submitOnEnter", () => {
  const action = sinon.stub();

  function fakeEnterPressed(controlPressed) {
    return {
      keyCode: 13,
      key: "Enter",
      ctrlKey: controlPressed,
      preventDefault: sinon.stub(),
    };
  }

  beforeEach(() => {
    jQueryOnStub.resetHistory();
    $.resetHistory();
    action.resetHistory();
  });

  it("attaches event handlers to the given textareas", () => {
    let textareas = ["one", "two"],
      numberOfTextareas = textareas.length;

    submitOnEnter(textareas, action);

    sinon.assert.callCount($, numberOfTextareas);
    sinon.assert.callCount(jQueryOnStub, numberOfTextareas);
    sinon.assert.alwaysCalledWith(jQueryOnStub, "keyup");

    sinon.assert.calledWith($, "one");
    sinon.assert.calledWith($, "two");
  });

  it("action is not triggered when control is not pressed for textarea", () => {
    let input = ["one"],
      event = fakeEnterPressed(false);

    submitOnEnter(input, action);

    const handler = jQueryOnStub.getCall(0).args[1];
    handler(event);

    expect(action.calledOnce).to.be.false;
  });

  it("action is triggered when control is pressed for textareas", () => {
    let input = ["one"],
      event = fakeEnterPressed(true);

    submitOnEnter(input, action);

    const handler = jQueryOnStub.getCall(0).args[1];
    handler(event);

    expect(action.calledOnce).to.be.true;
  });

  it("action is not triggered for textareas when something other than enter is entered", () => {
    let input = ["one"],
      event = fakeEnterPressed(true);

    event.key = "Something Else";
    event.keyCode = 15;

    submitOnEnter(input, action);

    const handler = jQueryOnStub.getCall(0).args[1];
    handler(event);

    expect(action.calledOnce).to.be.false;
  });
});
