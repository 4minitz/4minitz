import { expect } from 'chai';
import {AssertHelper} from '../test-helper/assert-helper';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const EXPECTED_PRIORITY_MAP = {
    1: '1 - High',
    2: '2',
    3: '3 - Medium',
    4: '4',
    5: '5 - Low'
};


let i18n = {
    setLocale: sinon.stub(),
    getLocale: sinon.stub(),
    __: sinon.stub()
};

const {
    Priority
} = proxyquire('../../../imports/priority', {
    'meteor/universe:i18n': { i18n, '@noCallThru': true},
});


describe('Priority', function() {

    describe('#constructor', function() {

        it('should assign the given value as a property', function() {
            const value = 2;
            const prio = new Priority(value);
            expect(prio.value).to.equal(value)
        });

        it('should convert a numeric string value to an integer', function() {
            const value = '2';
            const prio = new Priority(value);
            expect(prio.value).to.equal(parseInt(value, 10));
        });

        it('should throw an exception for values below 1', function() {
            AssertHelper.shouldThrow(() => new Priority(0), 'Constructor should throw an exception for the value 0');
        });

        it('should throw an exception for values over 5', function() {
            AssertHelper.shouldThrow(() => new Priority(6), 'Constructor should throw an exception for the value 6');
        });

        it('should throw an exception for values of an invalid type', function() {
            AssertHelper.shouldThrow(() => new Priority('b'), 'Constructor should throw an exception for the value of type string');
        });

    });

    describe('#toString', function() {

        it('should return the string representation of the value', function() {
            const prio = new Priority(2);
            expect(prio.toString()).to.equal(EXPECTED_PRIORITY_MAP[2]);
        });

        it('should throw for an invalid value', function() {
            const prio = new Priority(3);
            prio.value = 7;
            AssertHelper.shouldThrow(() => prio.toString(), 'should throw for the value 7');
        });

    });

    describe('#GET_DEFAULT_PRIORITY', function() {

        it('should return an object of type Priority', function() {
            const defaultPrio = Priority.GET_DEFAULT_PRIORITY();
            expect(defaultPrio instanceof Priority).to.be.true;
        });

        it('should return priority with value 3', function() {
            const defaultPrio = Priority.GET_DEFAULT_PRIORITY();
            expect(defaultPrio.value).to.equal(3);
        });

    });

    describe('#GET_PRIORITIES', function() {

        it('should return an array with five elements', function() {
            const prios = Priority.GET_PRIORITIES();
            expect(prios).to.have.length(5);
        });

        it('should return an array of Priorities', function() {
            const prios = Priority.GET_PRIORITIES();
            prios.forEach(prio => expect(prio instanceof Priority).to.be.true);
        });

    });

});