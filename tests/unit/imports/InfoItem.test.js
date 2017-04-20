/**
 * Created by felix on 18.05.16.
 */
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import _ from 'underscore';
import * as Helpers from '../../../lib/date';

let Topic = {};
let Label = {};

Helpers['@noCallThru'] = true;

const {
    InfoItem
    } = proxyquire('../../../imports/infoitem', {
    'meteor/underscore': { _, '@noCallThru': true},
    '/lib/date': Helpers,
    './topic': { Topic, '@noCallThru': true},
    './label': { Label, '@noCallThru': true}
});

describe('InfoItem', function() {

    let dummyTopic, infoItemDoc;

    beforeEach(function () {
        dummyTopic = {
            _id: "AaBbCcDd",
            _infoItems: [],
            upsertInfoItem: sinon.stub(),
            findInfoItem: function(id) {
                let index = Helpers.subElementsHelper.findIndexById(id, this._infoItems);
                if (index == undefined) return undefined;
                return new InfoItem(this, this._infoItems[index]);
            },
            // test-only method
            addInfoItem: function (infoItem) {
                infoItem._infoItemDoc.createdInMinute = "AaBbCcDd01";
                this._infoItems.push(infoItem._infoItemDoc);
            }
        };

        infoItemDoc = {
            _id: "AaBbCcDd01",
            subject: "infoItemDoc",
            createdAt: new Date(),
            createdInMinute: "AaBbCcDd01"
        };
    });

    describe('#constructor', function () {

        it('sets the reference to the parent topic correctly', function() {
            let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);
            // the infoItem should have a reference of our dummyTopic
            expect(myInfoItem._parentTopic).to.equal(dummyTopic);
        });

        it('sets the document correctly', function() {
            let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);
            // the doc should be equal to our initial document
            expect(myInfoItem._infoItemDoc).to.equal(infoItemDoc);
        });

        it('creates the same object by passing the id of an existing one', function() {
            let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);
            // add the created info item to our dummy topic
            dummyTopic.addInfoItem(myInfoItem);

            // Now we should be able to create the same info item again
            // by passing the dummyTopic together with the info items id
            let sameInfoItem = new InfoItem(dummyTopic, myInfoItem._infoItemDoc._id);
            // the associated documents of both info items should be the same
            expect(sameInfoItem._infoItemDoc).to.equal(myInfoItem._infoItemDoc);
        });

    });

    it('#isActionItem', function () {
        let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);
        expect(myInfoItem.isActionItem(), "Item without the itemType-property should not be an ActionItem").to.be.false;

        let actionItemDoc = {
            _id: "AaBbCcDd02",
            subject: "actionItemDoc",
            itemType: 'actionItem'
        };
        expect(InfoItem.isActionItem(actionItemDoc), "Item with the itemType-property set to actionItem should be an ActionItem").to.be.true;

    });

    it('#save', function() {
        let myInfoItem = new InfoItem(dummyTopic, infoItemDoc);

        myInfoItem.save();
        expect(dummyTopic.upsertInfoItem.calledOnce).to.be.true;

        dummyTopic.upsertInfoItem.reset();

    });

});