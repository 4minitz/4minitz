/**
 * Created by felix on 18.05.16.
 */
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let Topic = {};

const {
    InfoItem
    } = proxyquire('../../../imports/infoitem', {
    './topic': { Topic, '@noCallThru': true}
});

describe('InfoItem', function() {

    let dummyTopic, infoItemDoc;

    beforeEach(function () {
        dummyTopic = {
            _id: "AaBbCcDd",
            _infoItems: [],
            upsertInfoItem: sinon.stub(),
            findInfoItem: function(id) {
                let index = subElementsHelper.findIndexById(id, this._infoItems);
                if (index == undefined) return undefined;
                return new InfoItem(this, this._infoItems[index]);
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

    it('#isActionItem', function () {
        let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);
        expect(myInfoItem.isActionItem()).to.be.false;

        let actionItemDoc = {
            _id: "AaBbCcDd02",
            subject: "actionItemDoc",
            isOpen: false
        };
        expect(InfoItem.isActionItem(actionItemDoc)).to.be.true;

    });

    it('#save', function() {
        let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);

        myInfoItem.save();
        expect(dummyTopic.upsertInfoItem.calledOnce).to.be.true;

        dummyTopic.upsertInfoItem.reset();

    });

});