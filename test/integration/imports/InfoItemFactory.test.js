import { expect } from 'meteor/practicalmeteor:chai';

import { Minutes } from '/imports/minutes';
import { Topic } from '/imports/topic';
import { InfoItem } from '/imports/infoitem';
import { ActionItem } from '/imports/actionitem';
import { InfoItemFactory } from '/imports/InfoItemFactory';

import '/lib/date';

describe('InfoItemFactory', function () {

    let doc, parentTopic, minute;

    beforeEach(function () {
        doc = {};
        let topicDoc = {_id: 'AaBbCc02'};
        minute = new Minutes({_id: 'AaBbCc01', date: new Date(), topics:[topicDoc]});
        parentTopic = new Topic(minute, topicDoc);
    });

    it('creates a new infoItem object from a info item document', function () {
        doc = {
            _id: 'AaBbCc03',
            itemType: 'infoItem',
            subject: 'My Info Item',
            createdInMinute: minute._id
        };

        let item = InfoItemFactory.createInfoItem(parentTopic, doc);
        expect(item instanceof InfoItem).to.be.true;
    });

    it('creates a new infoItem object containing the document and the default properties', function () {
        doc = {
            _id: 'AaBbCc04',
            itemType: 'infoItem',
            subject: 'My Info Item',
            createdInMinute: minute._id
        };

        let item = InfoItemFactory.createInfoItem(parentTopic, doc);
        expect(item._infoItemDoc._id).to.equal(doc._id);
        expect(item._infoItemDoc.itemType).to.equal(doc.itemType);
        expect(item._infoItemDoc.subject).to.equal(doc.subject);
        expect(item._infoItemDoc).to.have.ownProperty('labels');
        expect(item._infoItemDoc).to.have.ownProperty('isSticky');
        expect(item._infoItemDoc.isSticky).to.be.false;
    });

    it('creates a new actionItem object from a action item document', function () {
        doc = {
            _id: 'AaBbCc05',
            itemType: 'actionItem',
            subject: 'My Action Item',
            createdInMinute: minute._id
        };

        let item = InfoItemFactory.createInfoItem(parentTopic, doc);
        expect(item instanceof ActionItem).to.be.true;
    });

    it('creates a new actionItem object containing the document and the default properties', function () {
        doc = {
            _id: 'AaBbCc06',
            itemType: 'actionItem',
            subject: 'My Action Item',
            createdInMinute: minute._id
        };

        let item = InfoItemFactory.createInfoItem(parentTopic, doc);
        expect(item._infoItemDoc._id).to.equal(doc._id);
        expect(item._infoItemDoc.itemType).to.equal(doc.itemType);
        expect(item._infoItemDoc.subject).to.equal(doc.subject);
        expect(item._infoItemDoc).to.have.ownProperty('labels');
        expect(item._infoItemDoc).to.have.ownProperty('isSticky');
        expect(item._infoItemDoc.isSticky).to.be.false;
    });

});