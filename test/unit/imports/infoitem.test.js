/**
 * Created by felix on 10.05.16.
 */

import { expect } from 'meteor/practicalmeteor:chai';

import { Topic } from '/imports/topic'
import { InfoItem } from '/imports/infoitem'
import { InfoItemFactory } from '/imports/InfoItemFactory'

describe('Unit-Test for class InfoItem', function() {

    let dummyTopic, infoItemDoc;

    beforeEach(function () {
        dummyTopic = {
            _id: "AaBbCcDd",
            _infoItems: [],
            upsertInfoItem: function() {
                // this method must be declared but we do not need any functionality for our tests
            },
            findInfoItem: function(id) {
                let index = subElementsHelper.findIndexById(id, this._infoItems);
                if (index == undefined) return undefined;
                return InfoItemFactory.createInfoItem(this, this._infoItems[index]);
            },
            // test-only method
            addInfoItem: function (infoItem) {
                this._infoItems.push(infoItem._infoItemDoc);
            }
        };

        infoItemDoc = {
            _id: "AaBbCcDd01",
            subject: "infoItemDoc",
            createdAt: new Date()
        };
    });

    it('#constructor', function () {
        let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);

        // the infoItem should have a reference of our dummyTopic
        expect(myInfoItem._parentTopic).to.equal(dummyTopic);
        // the doc should be equal to our initial document
        expect(myInfoItem._infoItemDoc).to.equal(infoItemDoc);

        // add the created info item to our dummy topic
        dummyTopic.addInfoItem(myInfoItem);

        // Now we should be able to create the same info item again
        // by passing the dummyTopic together with the info items id
        let sameInfoItem = new InfoItem(dummyTopic, myInfoItem._infoItemDoc._id);
        // the associated documents of both info items should be the same
        expect(sameInfoItem._infoItemDoc).to.equal(myInfoItem._infoItemDoc);
    });

    it('#save', function() {
        let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);

        // the save method of our dummyTopic-object should be called
        let spy = sinon.spy(dummyTopic, "upsertInfoItem");

        myInfoItem.save();
        expect(spy.calledOnce).to.be.true;

        spy.restore();

    });

});