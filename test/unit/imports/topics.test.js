/**
 * Created by felix on 10.05.16.
 */

import { expect } from 'meteor/practicalmeteor:chai';

import { Topic } from '/imports/topic'
import { Minutes } from '/imports/minutes'

describe('Unit-Test for class Topic', function() {

    let dummyMinute;
    let stub;
    let topicDoc;

    beforeEach(function () {
        dummyMinute = {
            _id: "AaBbCcDd",
            upsertTopic: function() {
                // this method must be declared but we do not need any functionality for our tests
            }
        };

        // mock the static method findOne of the minutes-class
        // so that this method will always return our dummy minute
        stub = sinon.stub(Minutes, "findOne", function() {
            return dummyMinute;
        });

        topicDoc = {
            subject: "topic-subject"
        }
    });

    afterEach(function() {
        stub.restore();
    });

    it('#constructor', function () {
        let myTopic = new Topic(dummyMinute._id, topicDoc);

        // the parent minute should be equal to our dummy parent minute
        expect(myTopic._parentMinutes).to.equal(dummyMinute);
        // the subject of the new topic should be equal to the initial value
        expect(myTopic._topicDoc.subject).to.equal(topicDoc.subject);
        // the new topic should be "opened"
        expect(myTopic._topicDoc.isOpen).to.be.true;
        // the created topic should have the isNew-Flag
        expect(myTopic._topicDoc.isNew).to.be.true;
    });

    it('#toggleState', function () {
        let myTopic = new Topic(dummyMinute._id, topicDoc);

        let oldState = myTopic._topicDoc.isOpen;

        myTopic.toggleState();

        // state should have changed
        expect(myTopic._topicDoc.isOpen).to.not.equal(oldState);

    });

    it('#upsertInfoItem', function() {
        let myTopic = new Topic(dummyMinute._id, topicDoc);

        let topicItemDoc = {
            subject: "info-item-subject",
                createdAt: new Date()
        };

        myTopic.upsertInfoItem(topicItemDoc);

        // our topic should now have exactly one topic item
        expect(myTopic.getInfoItems().length).to.equal(1);
        // the new topic item should have a id
        expect(myTopic.getInfoItems()[0]._id).to.not.be.false;
        // the subject of the new topic item should be equal to the initial value
        expect(myTopic.getInfoItems()[0].subject).to.equal(topicItemDoc.subject);

        // Change the subject and call the upsertTopicItem method again
        let topicItem = myTopic.getInfoItems()[0];
        topicItem.subject = "new_subject";

        myTopic.upsertInfoItem(topicItem);

        // our topic should still have exaclty one topic item
        expect(myTopic.getInfoItems().length).to.equal(1);
        // the id of this item should not have changed
        expect(myTopic.getInfoItems()[0]._id).to.equal(topicItem._id);
        // but the subject should have changed
        expect(myTopic.getInfoItems()[0].subject).to.equal(topicItem.subject);
    });

    it('#findInfoItem', function() {
        let myTopic = new Topic(dummyMinute._id, topicDoc);
        let infoItemDoc = {
            _id: 'AaBbCcDd01',
            subject: "info-item-subject",
            createdAt: new Date()
        };

        // new info item is not added yet, so our topic should not find it
        let foundItem = myTopic.findInfoItem(infoItemDoc._id);
        expect(foundItem).to.equal(undefined);

        // now we add the info item to our topic
        myTopic.upsertInfoItem(infoItemDoc);

        foundItem = myTopic.findInfoItem(infoItemDoc._id);
        // foundItem should not be undefined
        expect(foundItem).to.not.equal(undefined);
        // the subject of the found item should be equal to its initial value
        expect(foundItem._infoItemDoc.subject).to.equal(infoItemDoc.subject);
    });

    it('#removeInfoItem', function() {
        let myTopic = new Topic(dummyMinute._id, topicDoc);

        let infoItemDoc = {
            _id: 'AaBbCcDd01',
            subject: "info-item-subject",
            createdAt: new Date()
        };
        let infoItemDoc2 = {
            _id: 'AaBbCcDd02',
            subject: "info-item-subject2",
            createdAt: new Date()
        };

        // now we add the info items to our topic
        myTopic.upsertInfoItem(infoItemDoc);
        myTopic.upsertInfoItem(infoItemDoc2);

        // check that the two info items was added
        expect(myTopic.getInfoItems().length).to.equal(2);

        // remove the second one
        myTopic.removeInfoItem(infoItemDoc2._id);

        // check that there are now only one items
        expect(myTopic.getInfoItems().length).to.equal(1);

        // check that the first item is still part of our topic
        expect(myTopic.getInfoItems()[0]._id).to.equal(infoItemDoc._id);

    });

    it('#save', function() {
        let myTopic = new Topic(dummyMinute._id, topicDoc);

        // the save-method should call the upsertTopic-Method of the parent Minute
        // so we spy on it
        var spy = sinon.spy(dummyMinute, "upsertTopic");

        myTopic.save();

        expect(spy.calledOnce).to.be.true;
        expect(spy.calledWith(myTopic._topicDoc)).to.be.true;

        spy.restore();
    });

});