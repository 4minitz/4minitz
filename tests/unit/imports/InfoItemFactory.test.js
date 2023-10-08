import { expect } from 'chai';
import proxyquire from 'proxyquire';


const TestSetup = {
    nextItemIsAnActionItem: false,
    infoItemConstructorCallCount: 0,
    actionItemConstructorCallCount: 0,
    infoItemConstructorArguments: [],
    actionItemConstructorArguments: [],
    reset: function() {
        this.nextItemIsAnActionItem = false;
        this.infoItemConstructorCallCount = 0;
        this.actionItemConstructorCallCount = 0;
        this.infoItemConstructorArguments = [];
        this.actionItemConstructorArguments = [];
    }
};

class InfoItem {
    constructor() {
        TestSetup.infoItemConstructorCallCount++;
        TestSetup.infoItemConstructorArguments.push(arguments);
    }
    static isActionItem() {
        return TestSetup.nextItemIsAnActionItem;
    }
}

class ActionItem {
    constructor() {
        TestSetup.actionItemConstructorCallCount++;
        TestSetup.actionItemConstructorArguments.push(arguments);
    }
}

const {
    InfoItemFactory
} = proxyquire('../../../imports/InfoItemFactory', {
    './infoitem': { InfoItem, '@noCallThru': true},
    './actionitem': { ActionItem, '@noCallThru': true}
});

describe('InfoItemFactory', () => {

    afterEach(() => {
        TestSetup.reset();
    });

    describe('#createInfoItem', () => {

        let infoItemDoc, parentItemDoc;

        const verifyArguments = (actualArgs) => {
            expect(actualArgs[0][0]).to.deep.equal(parentItemDoc);
            expect(actualArgs[0][1]).to.deep.equal(infoItemDoc);
        };

        beforeEach(() => {
            infoItemDoc = {name: 'A Info Item'};
            parentItemDoc = {name: 'A Parent Item'};
        });

        it('should call the info item constructor if InfoItem.isActionItem returns false', () => {
            InfoItemFactory.createInfoItem(parentItemDoc, infoItemDoc);
            expect(TestSetup.infoItemConstructorCallCount, 'InfoItem constructor should have been called once').to.equal(1);
            expect(TestSetup.actionItemConstructorCallCount, 'actionItem constructor should not have been called').to.equal(0);
        });

        it('should create a new info item if InfoItem.isActionItem returns true', () => {
            TestSetup.nextItemIsAnActionItem = true;
            InfoItemFactory.createInfoItem(parentItemDoc, infoItemDoc);
            expect(TestSetup.infoItemConstructorCallCount, 'InfoItem constructor should not have been called').to.equal(0);
            expect(TestSetup.actionItemConstructorCallCount, 'actionItem constructor should have been called once').to.equal(1);
        });

        it('should pass the correct arguments to the info item constructor', () => {
            InfoItemFactory.createInfoItem(parentItemDoc, infoItemDoc);
            verifyArguments(TestSetup.infoItemConstructorArguments);
        });

        it('should pass the correct arguments to the action item constructor', () => {
            TestSetup.nextItemIsAnActionItem = true;
            InfoItemFactory.createInfoItem(parentItemDoc, infoItemDoc);
            verifyArguments(TestSetup.actionItemConstructorArguments);
        });

    });

});
