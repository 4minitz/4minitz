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
let UserRoles = {};

const {
    MeetingSeries
} = proxyquire('../../../imports/meetingseries', {
    'meteor/meteor': { Meteor, '@noCallThru': true},
    './collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true},
    './minutes': { Minutes, '@noCallThru': true},
    './topic': { Topic, '@noCallThru': true},
    './userroles': { UserRoles, '@noCallThru': true},
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

        it('sets the project correctly', function () {
            var ms = new MeetingSeries(meetingSeries);

            expect(ms.project).to.equal(meetingSeries.project);
        });

        it('sets the name correctly', function () {
            var ms = new MeetingSeries(meetingSeries);

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

        it('calls the meteor method meetingseries.insert', function () {
            meetingSeries.save();

            expect(Meteor.call.calledOnce).to.be.true;
        });

        it('sends the document to the meteor method meetingseries.insert', function () {
            meetingSeries.save();

            expect(Meteor.call.calledWith('meetingseries.insert', meetingSeries)).to.be.true;
        });
    });
});
