/**
 * Created by felix on 19.05.16.
 */
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';
import * as Helpers from '../../../imports/helpers/date';
import * as SubElements from '../../../imports/helpers/subElements';

require('sinon-as-promised');

let MinutesCollection = {
    find: sinon.stub(),
    findOne: sinon.stub()
};

class MeteorError {}

let Meteor = {
    call: sinon.stub(),
    callPromise: sinon.stub().resolves(true),
    Error: MeteorError
};

let PromisedMethods = {};

let isCurrentUserModeratorStub = sinon.stub();
let updateLastMinutesDateStub = sinon.stub();
let updateLastMinutesDateAsyncStub = sinon.stub().resolves(true);
let MeetingSeries = function(seriesId) {
    this._id = seriesId;
    this.isCurrentUserModerator = isCurrentUserModeratorStub;
    this.updateLastMinutesDate = updateLastMinutesDateStub;
    this.updateLastMinutesDateAsync = updateLastMinutesDateAsyncStub;
};

let topicGetOpenActionItemsStub = sinon.stub().returns([]);
let Topic = function () {
    this.getOpenActionItems = topicGetOpenActionItemsStub;
};
Topic.hasOpenActionItem = () => { return false; };

let ActionItem = function (topic, doc) {
    this._parentTopic = topic;
    this._infoItemDoc = doc;
};


Helpers['@noCallThru'] = true;
SubElements['@noCallThru'] = true;
const {
    Minutes
    } = proxyquire('../../../imports/minutes', {
    'meteor/meteor': { Meteor, '@noCallThru': true},
    './collections/minutes_private': { MinutesCollection, '@noCallThru': true},
    './collections/workflow_private': { null, '@noCallThru': true},
    './helpers/promisedMethods': { PromisedMethods, '@noCallThru': true},
    './meetingseries': { MeetingSeries, '@noCallThru': true},
    './topic': { Topic, '@noCallThru': true},
    './actionitem': { ActionItem, '@noCallThru': true},
    '/imports/helpers/date': Helpers,
    '/imports/helpers/subElements': SubElements,
    'meteor/underscore': { _, '@noCallThru': true}
});

describe('Minutes', function () {

    let minutesDoc, minute;

    beforeEach(function () {
        minutesDoc = {
            meetingSeries_id: 'AaBbCc01',
            _id: 'AaBbCc02',
            date: '2016-05-06',
            createdAt: new Date(),
            topics: [],
            isFinalized: false,
            participants: '',
            agenda: ''
        };

        minute = new Minutes(minutesDoc);
    });

    afterEach(function () {
        MinutesCollection.find.reset();
        MinutesCollection.findOne.reset();
        Meteor.call.reset();
        Meteor.callPromise.reset();
        isCurrentUserModeratorStub.reset();
        updateLastMinutesDateStub.reset();
        topicGetOpenActionItemsStub.reset();
    });

    describe('#constructor', function () {

        it('sets the properties correctly', function () {
            expect(JSON.stringify(minute)).to.equal(JSON.stringify(minutesDoc));
        });

        it('fetches the minute from the database if the id was given', function() {

            new Minutes(minutesDoc._id);
            expect(MinutesCollection.findOne.calledOnce, "findOne should be called once").to.be.true;
            expect(MinutesCollection.findOne.calledWith(minutesDoc._id), "findOne should be called with the id").to.be.true;
        });

        it('throws exception if constructor will be called without any arguments', function () {
            let exceptionThrown;
            try {
                new Minutes();
                exceptionThrown = false;
            } catch (e) {
                exceptionThrown = (e instanceof MeteorError);
            }

            expect(exceptionThrown).to.be.true;
        });

    });

    describe('find', function () {

        it('#find', function () {
            Minutes.find("myArg");
            expect(MinutesCollection.find.calledOnce, "find-Method should be called once").to.be.true;
            expect(MinutesCollection.find.calledWithExactly("myArg"), "arguments should be passed").to.be.true;
        });

        it('#findOne', function () {
            Minutes.findOne("myArg");
            expect(MinutesCollection.findOne.calledOnce, "findOne-Method should be called once").to.be.true;
            expect(MinutesCollection.findOne.calledWithExactly("myArg"), "arguments should be passed").to.be.true;
        });

        describe('#findAllIn', function () {

            let minIdArray;
            let limit;

            beforeEach(function () {
                minIdArray = ['1', '2'];
                limit = 3;
            });

            it('calls the find-Method of the Collection', function () {
                Minutes.findAllIn(minIdArray, limit);
                expect(MinutesCollection.find.calledOnce, "find-Method should be called once").to.be.true;
            });

            it('sets the id selector correctly', function () {
                Minutes.findAllIn(minIdArray, limit);
                let selector = MinutesCollection.find.getCall(0).args[0];
                expect(selector, "Selector has the property _id").to.have.ownProperty('_id');
                expect(selector._id, '_id-selector has propery $in').to.have.ownProperty('$in');
                expect(selector._id.$in, 'idArray should be passed').to.deep.equal(minIdArray);
            });

            it('sets the option correctly (sort, no limit)', function () {
                let expectedOption = { sort: {date: -1} };
                Minutes.findAllIn(minIdArray);
                let options = MinutesCollection.find.getCall(0).args[1];
                expect(options).to.deep.equal(expectedOption);
            });

            it('sets the option correctly (sort and limit)', function () {
                let expectedOption = { sort: {date: -1}, limit: limit };
                Minutes.findAllIn(minIdArray, limit);
                let options = MinutesCollection.find.getCall(0).args[1];
                expect(options).to.deep.equal(expectedOption);
            });

        });

    });

    describe('#remove', function () {

        it('calls the meteor method minutes.remove', function () {
            Minutes.remove(minute._id);
            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the minutes id to the meteor method minutes.remove', function () {
            Minutes.remove(minute._id);
            expect(Meteor.callPromise.calledWithExactly('workflow.removeMinute', minute._id)).to.be.true;
        });

    });

    describe('#syncVisibility', function () {

        let visibleForArray, parentSeriesId;

        beforeEach(function () {
            visibleForArray = [
                '1',
                '2'
            ];
            parentSeriesId = minute.meetingSeries_id;
        });

        it('calls the meteor method minutes.syncVisibility', function () {
            Minutes.syncVisibility(parentSeriesId, visibleForArray);
            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the parentSeriesId and the visibleFor-array to the meteor method minutes.syncVisibility', function () {
            Minutes.syncVisibility(parentSeriesId, visibleForArray);
            expect(Meteor.callPromise.calledWithExactly('minutes.syncVisibility', parentSeriesId, visibleForArray)).to.be.true;
        });

    });

    describe('#update', function () {

        let updateDocPart;

        beforeEach(function () {
            updateDocPart = {
                date: '2016-05-07'
            }
        });

        it('calls the meteor method minutes.update', function () {
            minute.update(updateDocPart);
            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the doc part and the minutes id to the meteor method minutes.update', function () {
            minute.update(updateDocPart);
            let sentObj = JSON.parse(JSON.stringify(updateDocPart));
            sentObj._id = minute._id;
            expect(Meteor.callPromise.calledWithExactly('minutes.update', sentObj, undefined)).to.be.true;
        });

        it('updates the changed property of the minute object', async function () {
            await minute.update(updateDocPart);
            expect(minute.date).to.equal(updateDocPart.date);
        });

    });

    describe('#save', function () {

        it('calls the meteor method minutes.insert if a new minute will be saved', function () {
            delete minute._id;
            minute.save();
            expect(Meteor.call.calledOnce).to.be.true;
        });

        it('uses the workflow.addMinutes method to save a new minutes document', function () {
            delete minute._id;
            minute.save();
            expect(Meteor.call.calledWithExactly('workflow.addMinutes', minute, undefined, undefined)).to.be.true;
        });

        it('sets the createdAt-property if it is not set', function () {
            delete minute._id;
            delete minute.createdAt;
            minute.save();
            expect(minute).to.have.ownProperty('createdAt');
        });

        it('calls the meteor method minutes.update if a existing minute will be saved', function () {
            minute.save();
            expect(Meteor.call.calledOnce).to.be.true;
        });

        it('sends the minutes object to the meteor method minutes.update', function () {
            minute.save();
            expect(Meteor.call.calledWithExactly('minutes.update', minute)).to.be.true;
        });

    });

    it('#parentMeetingSeries', function () {
        let parentSeries = minute.parentMeetingSeries();
        expect(parentSeries instanceof MeetingSeries, "result should be an instance of MeetingSeries").to.be.true;
        expect(parentSeries._id, "created meeting series object should have the correct series id").to.equal(minute.meetingSeries_id);
    });

    it('#parentMeetingSeriesID', function () {
        expect(minute.parentMeetingSeriesID()).to.equal(minute.meetingSeries_id);
    });

    describe('topic related methods', function () {

        let topic1, topic2, topic3, topic4;

        beforeEach(function () {
            topic1 = {
                _id: "01",
                subject: "firstTopic",
                isNew: true,
                isOpen: true
            };
            topic2 = {
                _id: "02",
                subject: "2ndTopic",
                isNew: true,
                isOpen: false
            };
            topic3 = {
                _id: "03",
                subject: "3rdTopic",
                isNew: false,
                isOpen: true
            };
            topic4 = {
                _id: "04",
                subject: "4thTopic",
                isNew: false,
                isOpen: false
            };
            minute.topics.push(topic1);
            minute.topics.push(topic2);
            minute.topics.push(topic3);
            minute.topics.push(topic4);
        });

        describe('#findTopic', function () {

            it('finds the correct topic identified by its id', function () {
                expect(minute.findTopic(topic1._id)).to.deep.equal(topic1);
            });

            it('returns undefined if topic was not found', function () {
                expect(minute.findTopic('unknownId')).to.be.undefined;
            });

        });

        describe('#removeTopic', function () {

            it('removes the topic from the topics array', function () {
                let oldLength = minute.topics.length;
                minute.removeTopic(topic1._id);
                expect(minute.topics).to.have.length(oldLength-1);
            });

            it('calls the meteor method minutes.update', function () {
                minute.removeTopic(topic1._id);
                expect(Meteor.callPromise.calledOnce).to.be.true;
            });

        });

        describe('#getNewTopics', function () {

            it('returns the correct amount of topics', function () {
                expect(minute.getNewTopics()).to.have.length(2);
            });

            it('returns only new topics', function () {
                let newTopics = minute.getNewTopics();
                newTopics.forEach(topic => {
                    expect(topic.isNew, "isNew-flag should be set").to.be.true;
                });
            });

        });

        describe('#getOldClosedTopics', function () {

            it('returns the correct amount of topics', function () {
                expect(minute.getOldClosedTopics()).to.have.length(1);
            });

            it('returns only old and closed topics', function () {
                let oldClosedTopics = minute.getOldClosedTopics();
                oldClosedTopics.forEach(topic => {
                    expect(
                        topic.isNew && topic.isOpen,
                        "isNew and isOpen flag should both not set"
                    ).to.be.false;
                });
            });

        });

        describe('#getOpenActionItems', function () {

            it('calls the getOpenActionItems method for each topic', function () {
                minute.getOpenActionItems();
                expect(topicGetOpenActionItemsStub.callCount).to.equal(minute.topics.length);
            });

            it('concatenates all results of each getOpenActionItems-call', function () {
                topicGetOpenActionItemsStub.returns([5,7]);
                expect(minute.getOpenActionItems()).to.have.length(minute.topics.length * 2);

            });

        });

    });

    describe('#upsertTopic', function () {

        let topicDoc;

        beforeEach(function () {
            topicDoc = {
                subject: "myTopic"
            }
        });

        it('adds a new topic to the topic array', function () {
            minute.upsertTopic(topicDoc);
            expect(Meteor.callPromise.calledOnce).to.be.true;
            expect(Meteor.callPromise.calledWithExactly('minutes.addTopic', sinon.match.string, topicDoc));
        });

        it('adds a new topic which already has an id', function () {
            topicDoc._id = "myId";
            minute.upsertTopic(topicDoc);
            expect(Meteor.callPromise.calledOnce).to.be.true;
            expect(Meteor.callPromise.calledWithExactly('minutes.addTopic', topicDoc._id, topicDoc));
        });

        it('updates an existing topic correctly', function () {
            topicDoc._id = "myId";
            minute.topics.unshift(topicDoc);
            topicDoc.subject = "changedSubject";
            minute.upsertTopic(topicDoc);
            expect(minute.topics, "update an existing topic should not change the size of the topics array").to.have.length(1);
            expect(minute.topics[0].subject, "the subject should have been updated").to.equal(topicDoc.subject);
        });

        it('calls the meteor method minutes.update', function () {
            minute.upsertTopic(topicDoc);
            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the minutes id and the topic doc to the meteor method minutes.addTopic', function () {
            minute.upsertTopic(topicDoc);
            let callArgs = Meteor.callPromise.getCall(0).args;
            expect(callArgs[0], "first argument should be the name of the meteor method", 'minutes.addTopic');
            let sentDoc = callArgs[1];
            expect(callArgs[1], 'minutes id should be sent to the meteor method').to.equal(minutesDoc._id);
            expect(callArgs[2], 'topic-doc should be sent to the meteor method').to.equal(topicDoc);
        });

    });

    describe('#finalize', function () {

        it('calls the meteor method workflow.finalizeMinute', function() {
            minute.finalize();

            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the id to the meteor method workflow.finalizeMinute', function () {
            minute.finalize();

            expect(Meteor.callPromise.calledWith('workflow.finalizeMinute', minutesDoc._id)).to.be.true;
        });

    });

    describe('#unfinalize', function () {

        it('calls the meteor method workflow.unfinalizeMinute', function() {
            minute.unfinalize();

            expect(Meteor.callPromise.calledOnce).to.be.true;
        });

        it('sends the id to the meteor method workflow.unfinalizeMinute', function () {
            minute.unfinalize();

            expect(Meteor.callPromise.calledWithExactly('workflow.unfinalizeMinute', minutesDoc._id)).to.be.true;
        });

    });

    it('#isCurrentUserModerator', function () {
        minute.isCurrentUserModerator();

        expect(isCurrentUserModeratorStub.calledOnce).to.be.true;
    });

});