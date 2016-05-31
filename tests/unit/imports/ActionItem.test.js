/**
 * Created by felix on 18.05.16.
 */
import { expect } from 'chai';
import proxyquire from 'proxyquire';

let doNothing = () => {};

let Topic = {};

const {
    InfoItem
    } = proxyquire('../../../imports/infoitem', {
    './topic': { Topic, '@noCallThru': true}
});

const {
    ActionItem
    } = proxyquire('../../../imports/actionitem', {
    './infoitem': { InfoItem, '@noCallThru': true}
});

describe('ActionItem', function() {

    let dummyTopic, infoItemDoc;

    beforeEach(function () {
        dummyTopic = {
            _id: "AaBbCcDd",
            save: doNothing,
            findInfoItem: doNothing
        };

        infoItemDoc = {
            _id: "AaBbCcDd01",
            subject: "infoItemDoc",
            createdAt: new Date(),
            details: [
                {
                    date: '2016-05-06',
                    text: 'details Text'
                }
            ]
        };
    });

    describe('#constructor', function () {

        it('sets the reference to the parent topic correctly', function() {
            let myActionItem = new ActionItem(dummyTopic, infoItemDoc);

            // the infoItem should have a reference of our dummyTopic
            expect(myActionItem._parentTopic).to.equal(dummyTopic);
        });

        it('sets the document correctly', function() {
            let myActionItem = new ActionItem(dummyTopic, infoItemDoc);
            // the doc should be equal to our initial document
            expect(myActionItem._infoItemDoc).to.deep.equal(infoItemDoc);
        });

        it('sets the initial value for the isOpen-flag correctly', function() {
            let myActionItem = new ActionItem(dummyTopic, infoItemDoc);
            // the isOpen-filed should be initially true for a new actionItem
            expect(myActionItem._infoItemDoc.isOpen).to.be.true;
        });

        it('sets the initial value for the isNew-flag correctly', function() {
            let myActionItem = new ActionItem(dummyTopic, infoItemDoc);
            // the isOpen-filed should be initially true for a new actionItem
            expect(myActionItem._infoItemDoc.isNew).to.be.true;
        });
    });

    it('#getDateFromDetails', function () {
        let myActionItem = new ActionItem(dummyTopic, infoItemDoc);

        expect(myActionItem.getDateFromDetails()).to.equal(infoItemDoc.details[0].date);
    });

    it('#getTextFromDetails', function () {
        let myActionItem = new ActionItem(dummyTopic, infoItemDoc);

        expect(myActionItem.getTextFromDetails()).to.equal(infoItemDoc.details[0].text);
    });

    it('#toggleState', function() {
        let myActionItem = new ActionItem(dummyTopic, infoItemDoc);

        let oldState = myActionItem._infoItemDoc.isOpen;

        myActionItem.toggleState();

        // state should have changed
        expect(myActionItem._infoItemDoc.isOpen).to.not.equal(oldState);
    });

});