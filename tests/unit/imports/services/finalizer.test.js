import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import * as DateHelpers from '../../../../imports/helpers/date';


let MinutesSchema = {
    update: sinon.stub(),
};

let MeetingSeriesSchema = {
    update: sinon.stub(),
};

const Minutes = sinon.stub();
const check = sinon.stub();
const UserRoles = sinon.stub();
const FinalizeMailHandler = _ => {};
const MeteorError = (err, details) => {
    const e = new Error(err);
    e.details = details;
    return e;
};
const MeteorMethods = {};

let Meteor = {
    userId: sinon.stub(),
    user: sinon.stub(),
    defer: fn => fn(),
    methods: m => Object.assign(MeteorMethods, m),
    isClient: false,
    callPromise: sinon.stub().resolves(true),
    Error: MeteorError
};

let PromisedMethods = {};
DateHelpers['@noCallThru'] = true;

const GlobalSettings = {
    isEMailDeliveryEnabled: sinon.stub().returns(false),
    getDefaultEmailSenderAddress: sinon.stub().returns('noreply@example.com')
};

const {
    Finalizer
} = proxyquire('../../../../imports/services/finalizer', {
    'meteor/meteor': { Meteor, '@noCallThru': true},
    'meteor/check': { check, '@noCallThru': true},
    '/imports/collections/minutes.schema': { MinutesSchema, '@noCallThru': true},
    '/imports/collections/meetingseries.schema': { MeetingSeriesSchema, '@noCallThru': true},
    '/imports/minutes': { Minutes, '@noCallThru': true},
    '/imports/userroles': { UserRoles, '@noCallThru': true},
    '/imports/helpers/promisedMethods': { PromisedMethods, '@noCallThru': true},
    '/imports/mail/FinalizeMailHandler': { FinalizeMailHandler, '@noCallThru': true},
    '/imports/config/GlobalSettings': { GlobalSettings, '@noCallThru': true},
    '/imports/helpers/date': DateHelpers
});

describe('workflow.finalizeMinute', function () {
    const finalizeMeteorMethod = MeteorMethods['workflow.finalizeMinute'],
        fakeMeetingSeries = {
            openTopics: [],
            topics: [],
            server_finalizeLastMinute: sinon.stub()
        };
    let minutes;

    beforeEach(function () {
        minutes = {
            meetingSeries_id: 'AaBbCc01',
            _id: 'AaBbCc02',
            date: '2016-05-06',
            createdAt: new Date(),
            topics: [],
            isFinalized: false,
            participants: '',
            agenda: '',
            parentMeetingSeriesID: sinon.stub().returns(12),
            parentMeetingSeries: sinon.stub().returns(fakeMeetingSeries)
        };
        Minutes.returns(minutes);

        const userRoles = {
            isModeratorOf: sinon.stub().returns(true)
        };
        UserRoles.returns(userRoles);

        Meteor.userId.returns('12');

        Meteor.user.returns({username: 'me'});
    });

    afterEach(function () {
        Minutes.reset();
        UserRoles.reset();
        Meteor.userId.reset();
        Meteor.user.reset();
    });

    it('throws an exception if the user is not logged in', function () {
        Meteor.userId.reset();
        Meteor.userId.returns();

        try {
            finalizeMeteorMethod(minutes._id);
        } catch (e) {
            const expectedErrorMessage = 'not-authorized';
            const expectedDetails = 'You are not authorized to perform this action.';
            expect(e.message).to.deep.equal(expectedErrorMessage);
            expect(e.details).to.deep.equal(expectedDetails);
        }
    });

    it('throws an exception if the user is not authorized', function () {
        UserRoles.reset();
        UserRoles.returns({isModeratorOf: sinon.stub().returns(false)});

        try {
            finalizeMeteorMethod(minutes._id);
        } catch (e) {
            const expectedErrorMessage = 'Cannot modify this minutes/series';
            const expectedDetails = 'You are not a moderator of the meeting series.';
            expect(e.message).to.deep.equal(expectedErrorMessage);
            expect(e.details).to.deep.equal(expectedDetails);
        }
    });

    it('workflow.finalizeMinute', function () {
        finalizeMeteorMethod(minutes._id);
    });
});

describe('Finalizer', function () {
    let minutesId, minutes;

    beforeEach(function () {
        minutesId = 'AaBbCc02';

        minutes = {};
        Minutes.returns(minutes);
    });

    afterEach(function () {
        Meteor.callPromise.resetHistory();
        Minutes.reset();
    });

    describe('#finalize', function () {
        it('calls the meteor method workflow.finalizeMinute', function() {
            Finalizer.finalize();

            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the id to the meteor method workflow.finalizeMinute', function () {
            Finalizer.finalize(minutesId);

            expect(Meteor.callPromise.calledWith('workflow.finalizeMinute', minutesId)).to.be.true;
        });
    });

    describe('#unfinalize', function () {
        it('calls the meteor method workflow.unfinalizeMinute', function() {
            Finalizer.unfinalize();

            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the id to the meteor method workflow.unfinalizeMinute', function () {
            Finalizer.unfinalize(minutesId);

            expect(Meteor.callPromise.calledWithExactly('workflow.unfinalizeMinute', minutesId)).to.be.true;
        });
    });

    describe('#finalizedInfo', function () {
        let minutes;

        beforeEach(function () {
            minutes = {};
            Minutes.returns(minutes);
        });

        afterEach(function () {
            Minutes.reset();
        });

        it('returns that the minutes was never finalized if it was never finalized', function () {
            Object.assign(minutes, {
                finalizedAt: null
            });

            const someId = '';
            const result = Finalizer.finalizedInfo(someId);

            const expectedResult = 'Never finalized';
            expect(result).to.deep.equal(expectedResult);
        });

        it('returns that the minutes was unfinalized if it was', function () {
            Object.assign(minutes, {
                finalizedAt: new Date(2017, 6, 1, 14, 4, 0),
                isFinalized: false,
                finalizedBy: 'me'
            });

            const someId = '';
            const result = Finalizer.finalizedInfo(someId);

            const expectedResult = 'Unfinalized on 2017-07-01 14:04:00 by me';
            expect(result).to.deep.equal(expectedResult);
        });

        it('returns that the minutes was finalized if it was', function () {
            Object.assign(minutes, {
                finalizedAt: new Date(2017, 6, 1, 14, 4, 0),
                isFinalized: true,
                finalizedBy: 'me'
            });

            const someId = '';
            const result = Finalizer.finalizedInfo(someId);

            const expectedResult = 'Finalized on 2017-07-01 14:04:00 by me';
            expect(result).to.deep.equal(expectedResult);
        });

        it('states the version if it is available', function () {
            Object.assign(minutes, {
                finalizedAt: new Date(2017, 6, 1, 14, 4, 0),
                isFinalized: true,
                finalizedBy: 'me',
                finalizedVersion: 13
            });

            const someId = '';
            const result = Finalizer.finalizedInfo(someId);

            const expectedResult = 'Version 13. Finalized on 2017-07-01 14:04:00 by me';
            expect(result).to.deep.equal(expectedResult);
        });
    });
});
