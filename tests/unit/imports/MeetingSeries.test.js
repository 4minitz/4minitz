import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';

let MeetingSeriesCollection = {};
let Meteor = {
    call: sinon.stub()
};
let Minutes = {};
let Topic = {};

const {
    MeetingSeries
} = proxyquire('../../../imports/meetingseries', {
    'meteor/meteor': { Meteor, '@noCallThru': true},
    './collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true},
    './minutes': { Minutes, '@noCallThru': true},
    './topic': { Topic, '@noCallThru': true},
    'meteor/underscore': { _, '@noCallThru': true}
});

describe('MeetingSeries', function () {
    describe('#constructor', function () {
        let meetingSeries;

        beforeEach(function () {
            meetingSeries = {
                project: 'foo',
                name: 'bar'
            };
        });

        it('constructs a new MeetingSeries', function () {
            var ms = new MeetingSeries(meetingSeries);

            expect(ms.project).to.equal(meetingSeries.project);
            expect(ms.name).to.equal(meetingSeries.name);
        });
    });

    describe('#save', function () {
        let meetingSeries;

        beforeEach(function () {
            meetingSeries = new MeetingSeries({
                project: 'foo',
                name: 'bar'
            });
        });

        it('sends the document to a meteor method', function () {
            meetingSeries.save();

            expect(Meteor.call.calledOnce).to.be.true;
            expect(Meteor.call.calledWith('meetingseries.insert', meetingSeries)).to.be.true;
        });
    });
});
