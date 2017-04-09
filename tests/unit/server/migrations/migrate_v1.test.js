/**
 * Created by felix on 18.05.16.
 */
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

require('../../../../lib/helpers');

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
        MigrateV1
    } = proxyquire('../../../../server/migrations/migrate_v1', {
    '/imports/collections/minutes_private': { MinutesCollection, '@noCallThru': true},
        '/imports/collections/meetingseries_private': { MeetingSeriesCollection, '@noCallThru': true}
    });

/**
 * Checks if the update method of the minutesCollection
 * was called with the correct arguments.
 *
 * @param minute
 * @param checkUpdatedTopic callback to verify that the topic
 *        was modified correctly.
 */
let checkUpdateMinuteCall = (minute, checkUpdatedTopic) => {
    expect(MinutesCollection.update.calledOnce).to.be.true;

    let updateCall = MinutesCollection.update.getCall(0);
    expect(updateCall.args[0]).to.equal(minute._id);

    let updateSetter = updateCall.args[1].$set;
    expect(updateSetter.hasOwnProperty('topics.0')).to.be.true;

    let updatedTopic = updateSetter['topics.0'];
    checkUpdatedTopic(updatedTopic);
};

/**
 * Checks if the update method of the meetingSeriesCollection
 * was called with the correct arguments.
 *
 * @param series
 * @param checkUpdatedTopic callback to verify that the topic
 *        was modified correctly.
 */
let checkUpdateMeetingSeriesCall = (series, checkUpdatedTopic) => {
    expect(MeetingSeriesCollection.update.callCount).to.equal(2);

    // first call on open topics
    let firstCall = MeetingSeriesCollection.update.getCall(0);
    expect(firstCall.args[0]).to.equal(series._id);

    let updateSetter1 = firstCall.args[1].$set;
    expect(updateSetter1.hasOwnProperty('openTopics.0')).to.be.true;

    let updTopic = updateSetter1['openTopics.0'];
    checkUpdatedTopic(updTopic);

    // second call on closed topics
    let sndCall = MeetingSeriesCollection.update.getCall(1);
    expect(sndCall.args[0]).to.equal(series._id);

    let updateSetter2 = sndCall.args[1].$set;
    expect(updateSetter2.hasOwnProperty('closedTopics.0')).to.be.true;

    let updClosedTopic = updateSetter2['closedTopics.0'];
    checkUpdatedTopic(updClosedTopic);
};

describe('Migrate Version 1', function () {

    let series, minute, topic, closedTopic;

    beforeEach(function () {
        topic = {
            subject: "Topic Subject",
            responsible: "person",
            isOpen: true,
            isNew: true,
            priority: "High",
            duedate: "2009-05-06",
            details: [{
                date: "2009-05-03",
                text: ""
            }]
        };

        closedTopic = JSON.parse(JSON.stringify(topic)); // clone topic
        closedTopic.isOpen = false;

        minute = {
            _id: 'AaBbCc01',
            topics: [
                topic
            ]
        };

        series = {
            _id: 'AaBbCc02',
            openTopics: [
                topic
            ],
            closedTopics: [
                closedTopic
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

    describe('#up', function () {

        let checkUpdatedTopic = (updatedTopic) => {
            expect(updatedTopic).to.not.have.ownProperty('details');
            expect(updatedTopic).to.not.have.ownProperty('duedate');
            expect(updatedTopic).to.not.have.ownProperty('priority');

            expect(updatedTopic).to.have.ownProperty('infoItems');
            expect(updatedTopic.infoItems).to.be.instanceof(Array);
            expect(updatedTopic.infoItems).to.be.empty;
        };

        it('modifies the topic of the minute in the minutes collection', function () {
            MigrateV1.up();

            checkUpdateMinuteCall(minute, checkUpdatedTopic);
        });

        it('modifies the open/closed topics of a series', function () {
            MigrateV1.up();

            checkUpdateMeetingSeriesCall(series, checkUpdatedTopic);
        })

    });

    describe('#down', function () {

        let checkUpdatedTopic = (updatedTopic) => {
            expect(updatedTopic).to.have.ownProperty('details');
            expect(updatedTopic).to.have.ownProperty('duedate');
            expect(updatedTopic).to.have.ownProperty('priority');

            expect(updatedTopic).to.not.have.ownProperty('infoItems');
        };

        it('modifies the topic of the minute in the minutes collection', function () {
            MigrateV1.down();

            checkUpdateMinuteCall(minute, checkUpdatedTopic);
        });

        it('modifies the open/closed topics of a series', function () {
            MigrateV1.down();

            checkUpdateMeetingSeriesCall(series, checkUpdatedTopic);
        });

    });

});