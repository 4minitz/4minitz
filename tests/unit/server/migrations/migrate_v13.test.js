import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

require('../../../../imports/helpers/date');

const FIRST_MIN_ID = '#Min01';
const SND_MIN_ID = '#Min02';

let MinutesCollection = {
    update: sinon.stub()
};
let MeetingSeriesCollection = {
    update: sinon.stub()
};

const {
        MigrateV13
    } = proxyquire('../../../../server/migrations/migrate_v13', {
        '/imports/collections/minutes_private': { MinutesCollection, '@noCallThru': true},
    '/imports/collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true}
    });

describe('Migrate Version 13', function () {

    let firstFakeMinute, sndFakeMinute, fakeMeetingSeries;

    beforeEach(function () {
        sndFakeMinute = {
            _id: SND_MIN_ID,
            topics: [{
                _id: '#T01'
            }, {
                _id: '#T02'
            }],
            nextMinutes: () => {
                return false;
            }
        };

        firstFakeMinute = {
            _id: FIRST_MIN_ID,
            topics: [{
                _id: '#T01'
            }],
            nextMinutes: () => {
                return sndFakeMinute;
            }
        };

        fakeMeetingSeries = {
            _id: '#MS01',
            topics: [{
                _id: '#T01'
            }, {
                _id: '#T02'
            }],
            openTopics: [{
                _id: '#T02'
            }, {
                _id: '#T01'
            }],
            firstMinutes: () => {
                return firstFakeMinute;
            }
        };

        MeetingSeriesCollection.find = () => {
            return [fakeMeetingSeries];
        };

        MinutesCollection.find = () => {
            return [firstFakeMinute, sndFakeMinute];
        };
    });

    afterEach(function () {
        MinutesCollection.update.reset();
        MeetingSeriesCollection.update.reset();
    });

    describe('#up', function () {

        let checkTopicHasProperty = topic => {
            expect(topic).to.have.ownProperty('isSkipped');
            expect(topic.isSkipped).to.be.false;
        };

        it('sets the isSkipped attribute for all topics in all minutes', function() {
            MigrateV13.up();
            firstFakeMinute.topics.forEach(checkTopicHasProperty);
            sndFakeMinute.topics.forEach(checkTopicHasProperty);
        });

        it('sets the isSkipped attribute for all topics in the meeting series', function() {
            MigrateV13.up();
            fakeMeetingSeries.topics.forEach(checkTopicHasProperty);
            fakeMeetingSeries.openTopics.forEach(checkTopicHasProperty);
        });
    });

    describe('#down', function () {

        beforeEach(function() {
            let addCreatedInMinuteFakeAttribute = (topic) => {
                topic.createdInMinute = 'fakeID';
            };
            firstFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
            sndFakeMinute.topics.forEach(addCreatedInMinuteFakeAttribute);
            fakeMeetingSeries.topics.forEach(addCreatedInMinuteFakeAttribute);
            fakeMeetingSeries.openTopics.forEach(addCreatedInMinuteFakeAttribute);
        });

        it('removes the isSkipped-attribute', function() {
            MigrateV13.down();

            let checkTopicHasNoAttribute = topic => {
                expect(topic).not.have.ownProperty('isSkipped');
            };

            firstFakeMinute.topics.forEach(checkTopicHasNoAttribute);
            sndFakeMinute.topics.forEach(checkTopicHasNoAttribute);
            fakeMeetingSeries.topics.forEach(checkTopicHasNoAttribute);
            fakeMeetingSeries.openTopics.forEach(checkTopicHasNoAttribute);
        });

    });

});
