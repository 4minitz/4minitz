import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';



let MinutesCollection = {

    minutes: [],

    find: function() {
        return this.minutes;
    },

    update: sinon.stub(),

    insert: function(minute) {
        this.minutes.push(minute);
    }
};

let MeetingSeriesCollection = {

    series: [],

    find: function() {
        return this.series;
    },

    update: sinon.stub(),

    insert: function(aSeries) {
        this.series.push(aSeries);
    }
};

const {
    MigrateV5
    } = proxyquire('../../../server/migrate_v5', {
    '/imports/collections/minutes_private': { MinutesCollection, '@noCallThru': true},
    '/imports/collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true}
});

describe('Migrate Version 5', function () {

    let series, minute, topicOfMinute, topicOfSeries, openTopic;

    beforeEach(function () {
        topicOfMinute = {
            subject: "Topic Subject",
            isOpen: true,
            isNew: true,
            infoItems: []
        };

        openTopic = JSON.parse(JSON.stringify(topicOfMinute)); // clone topic
        topicOfSeries = JSON.parse(JSON.stringify(topicOfMinute)); // clone topic

        minute = {
            _id: 'AaBbCc01',
            topics: [topicOfMinute]
        };

        series = {
            _id: 'AaBbCc02',
            topics: [
                topicOfSeries
            ],
            openTopics: [
                openTopic
            ]
        };

        MinutesCollection.insert(minute);
        MeetingSeriesCollection.insert(series);
    });

    afterEach(function () {
        MinutesCollection.update.reset();
        MeetingSeriesCollection.update.reset();
        MeetingSeriesCollection.series = [];
        MinutesCollection.minutes = [];
    });

    describe('#up', function() {

        it('adds the isRecurring flag for each topic in minutes collection', function () {
            MigrateV5.up();

            expect(minute.topics[0].isRecurring, "isRecurring flag should be added").to.be.false;
            expect(MinutesCollection.update.calledOnce, 'MinutesCollection.update should be called once').to.be.true;
        });

        it('adds the isRecurring flag for each topic in meeting series collection', function () {
            MigrateV5.up();

            expect(series.openTopics[0].isRecurring, "isRecurring flag should be added of the topics in the openTopics array").to.be.false;
            expect(series.topics[0].isRecurring, "isRecurring flag should be added of the topics in the topics array").to.be.false;
            expect(MinutesCollection.update.calledOnce, 'MinutesCollection.update should be called once').to.be.true;
        });

    });

    describe('#down', function() {

        beforeEach('add isRecurring property for each topic', function() {
            minute.topics[0].isRecurring = true;
            series.topics[0].isRecurring = false;
            series.openTopics[0].isRecurring = true;
        });

        it('removes the isRecurring flag for each topic in minutes collection', function () {
            MigrateV5.down();

            expect(minute.topics[0].isRecurring, "isRecurring flag should be removed").to.be.undefined;
            expect(MinutesCollection.update.calledOnce, 'MinutesCollection.update should be called once').to.be.true;
        });

        it('removes the isRecurring flag for each topic in meeting series collection', function () {
            MigrateV5.down();

            expect(series.openTopics[0].isRecurring, "isRecurring flag should be removed from the topics in the openTopics array").to.be.undefined;
            expect(series.topics[0].isRecurring, "isRecurring flag should be removed from the topics in the topics array").to.be.undefined;
            expect(MeetingSeriesCollection.update.calledOnce, 'MeetingSeriesCollection.update should be called once').to.be.true;
        });

    });

});