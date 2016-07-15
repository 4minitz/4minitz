import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';

let jQueryOnStub = sinon.mock();
let $ = sinon.mock().returns({
    on: jQueryOnStub
});

const submitOnEnter = proxyquire('../../../../client/helpers/submitOnEnter', {
    'meteor/jquery': { $, '@noCallThru': true},
    'meteor/underscore': { _, '@noCallThru': true}
}).default;

describe('submitOnEnter', function () {
    let action = sinon.stub();

    function fakeEnterPressed(controlPressed) {
        return {
            keyCode: 13,
                key: 'Enter',
            ctrlKey: controlPressed,
            preventDefault: sinon.stub()
        };
    }

    beforeEach(function () {
        jQueryOnStub.reset();
        $.reset();
        action.reset();
    });

    it('attaches event handlers to the given textareas', function () {
        let textareas = ['one', 'two'],
            numberOfTextareas = textareas.length;

        $.exactly(numberOfTextareas);
        jQueryOnStub.exactly(numberOfTextareas).withArgs('keyup');

        submitOnEnter(textareas, action);

        expect($.getCall(0).args[0]).to.eql('one');
        expect($.getCall(1).args[0]).to.eql('two');

        jQueryOnStub.verify();
    });

    it('action is not triggered when control is not pressed for textarea', function () {
        let input = ['one'],
            event = fakeEnterPressed(false);

        submitOnEnter(input, action);

        let handler = jQueryOnStub.getCall(0).args[1];
        handler(event);

        expect(action.calledOnce).to.be.false;
    });

    it('action is triggered when control is pressed for textareas', function () {
        let input = ['one'],
            event = fakeEnterPressed(true);

        submitOnEnter(input, action);

        let handler = jQueryOnStub.getCall(0).args[1];
        handler(event);

        expect(action.calledOnce).to.be.true;
    });

    it('action is not triggered for textareas when something other than enter is entered', function () {
        let input = ['one'],
            event = fakeEnterPressed(true);

        event.key = 'Something Else';
        event.keyCode = 15;

        submitOnEnter(input, action);

        let handler = jQueryOnStub.getCall(0).args[1];
        handler(event);

        expect(action.calledOnce).to.be.false;
    });
});
