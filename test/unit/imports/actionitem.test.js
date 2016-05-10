/**
 * Created by felix on 10.05.16.
 */

import { expect } from 'meteor/practicalmeteor:chai';

import { Topic } from '/imports/topic'
import { ActionItem } from '/imports/actionitem'

describe('Unit-Test for class ActionItem', function() {

    let dummyTopic, infoItemDoc;

    beforeEach(function () {
        dummyTopic = {
            _id: "AaBbCcDd",
            save: function () {
                // this method must be declared but we do not need any functionality for our tests
            },
            findInfoItem: function (id) {

            }
        };

        infoItemDoc = {
            _id: "AaBbCcDd01",
            subject: "infoItemDoc",
            createdAt: new Date()
        };
    });

    it('#constructor', function () {
        let myActionItem = new ActionItem(dummyTopic, infoItemDoc);

        // the infoItem should have a reference of our dummyTopic
        expect(myActionItem._parentTopic).to.equal(dummyTopic);
        // the doc should be equal to our initial document
        expect(myActionItem._infoItemDoc).to.equal(infoItemDoc);

        // the isOpen-filed should be initially true for a new actionItem
        expect(myActionItem._infoItemDoc.isOpen).to.be.true;
    });

    it('#toggleState', function() {
        let myActionItem = new ActionItem(dummyTopic, infoItemDoc);

        let oldState = myActionItem._infoItemDoc.isOpen;

        myActionItem.toggleState();

        // state should have changed
        expect(myActionItem._infoItemDoc.isOpen).to.not.equal(oldState);
    });

});