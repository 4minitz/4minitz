/**
 * Created by felix on 10.05.16.
 */

import { expect } from 'meteor/practicalmeteor:chai';

import { Topic } from '/imports/topic'
import { Minutes } from '/imports/minutes'

describe('Unit-Test for class Topic', function() {

    let dummyMinute;
    let stub;

    let doc = {
        subject: "topic-subject"
    };

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
    });

    afterEach(function() {
        stub.restore();
    });

    it('#constructor', function () {
        let myTopic = new Topic(dummyMinute._id, doc);

        // the parent minute should be equal to our dummy parent minute
        expect(myTopic._parentMinutes).to.equal(dummyMinute);
        // the subject of the new topic should be equal to the initial value
        expect(myTopic._topicDoc.subject).to.equal(doc.subject);
        // the new topic should be "opened"
        expect(myTopic._topicDoc.isOpen).to.be.true;
        // the created topic should have the isNew-Flag
        expect(myTopic._topicDoc.isNew).to.be.true;
    });

    it('#upsertTopicItem', function() {
        let myTopic = new Topic(dummyMinute._id, doc);

        let topicItemDoc = {
            subject: "topic-item-subject",
                createdAt: new Date()
        };

        myTopic.upsertTopicItem(topicItemDoc);

        // our topic should now have exactly one topic item
        expect(myTopic.getTopicItems().length).to.equal(1);
        // the new topic item should have a id
        expect(myTopic.getTopicItems()[0]._id).to.not.be.false;
        // the subject of the new topic item should be equal to the initial value
        expect(myTopic.getTopicItems()[0].subject).to.equal(topicItemDoc.subject);

        // Change the subject and call the upsertTopicItem method again
        let topicItem = myTopic.getTopicItems()[0];
        topicItem.subject = "new_subject";

        myTopic.upsertTopicItem(topicItem);

        // our topic should still have exaclty one topic item
        expect(myTopic.getTopicItems().length).to.equal(1);
        // the id of this item should not have changed
        expect(myTopic.getTopicItems()[0]._id).to.equal(topicItem._id);
        // but the subject should have changed
        expect(myTopic.getTopicItems()[0].subject).to.equal(topicItem.subject);
    });

});