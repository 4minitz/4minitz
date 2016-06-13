import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'

require('./../../lib/helpers');


describe('Sticky Info Items', function () {
    const aProjectName = "E2E Sticky Info Items";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
    let aInfoItemName = "";
    let aAICounter = 0;
    let aAINameBase = "Info Item Name #";

    let getNewMeetingName = () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };
    let getNewTopicName = () => {
        aTopicCounter++;
        return aTopicNameBase + aTopicCounter;
    };
    let getNewInfoItemName = () => {
        aAICounter++;
        aInfoItemName = aAINameBase + aAICounter;
        return aInfoItemName;
    };

    beforeEach("make sure test user is logged in, create series and add minutes", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingName = getNewMeetingName();

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        aTopicName = getNewTopicName();
        E2ETopics.addTopicToMinutes(aTopicName);

        E2ETopics.addInfoItemToTopic({
            subject: getNewInfoItemName(),
            infoItemType: "infoItem"
        }, 1);
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });

    it('is possible to toggle the sticky-state of info items', function () {
        E2ETopics.toggleInfoItemStickyState(1, 1);
        expect(E2ETopics.isInfoItemSticky(1, 1)).to.be.true;
    });

    it('ensures that sticky-info-items will be presented in the next minute again', function () {
        E2ETopics.toggleInfoItemStickyState(1, 1);

        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.gotoParentMeetingSeries();

        // add a second minute
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        expect(E2ETopics.countItemsForTopic(1), "The topic should have one item").to.equal(1);
        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let stickyInfoItem = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(stickyInfoItem).value, "the sticky info item should be displayed")
            .to.have.string(aInfoItemName);

        expect(E2ETopics.isInfoItemSticky(1, 1)).to.be.true;
    });

    it('closes a discussed topic which has a sticky-info-item but no open AIs and does not present the topic in the next minute again', function () {
        E2ETopics.toggleInfoItemStickyState(1, 1);
        E2ETopics.toggleTopic(1);

        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.gotoParentMeetingSeries();

        // add a second minute
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        expect(E2ETopics.countTopicsForMinute(), "the new minute should have no topics").to.equal(0);
    });

    it('ensures that the sticky-status of a finalized minute can not be modified', function () {
        E2EMinutes.finalizeCurrentMinutes();

        E2ETopics.toggleInfoItemStickyState(1, 1);
        expect(E2ETopics.isInfoItemSticky(1, 1), "non-sticky item should not have changed state").to.be.false;

        E2EMinutes.unfinalizeCurrentMinutes();
        E2ETopics.toggleInfoItemStickyState(1, 1);
        E2EMinutes.finalizeCurrentMinutes();


        expect(E2ETopics.isInfoItemSticky(1, 1), "sticky item should not have changed state").to.be.true;
    });

    it('can not change the sticky status of info-items on the topics page of the meeting series', function () {
        E2ETopics.addInfoItemToTopic({
            subject: getNewInfoItemName(),
            infoItemType: "infoItem"
        }, 1);
        E2ETopics.toggleInfoItemStickyState(1, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        E2ETopics.toggleInfoItemStickyState(1, 1);
        expect(E2ETopics.isInfoItemSticky(1, 1), "sticky item should not have changed state").to.be.true;

        E2ETopics.toggleInfoItemStickyState(1, 2);
        expect(E2ETopics.isInfoItemSticky(1, 2), "non-sticky item should not have changed state").to.be.false;
    });

    it('ensures that changing the subject of a sticky-info-item also updates the related item located ' +
        'in the topic list of the meeting series after finalizing the minute', function () {

        const newInfoItemName = "updated info item subject";

        E2ETopics.toggleInfoItemStickyState(1, 1);
        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        E2ETopics.editInfoItemForTopic(1, 1, {subject: newInfoItemName});
        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.countItemsForTopic(1), "topic should have one item").to.equal(1);

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let stickyInfoItem = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(stickyInfoItem).value, "the subject of the sticky info item should have changed")
            .to.have.string(newInfoItemName);

        expect(E2ETopics.isInfoItemSticky(1, 1), "the info item should be still sticky").to.be.true;
    });

    it('removes a sticky-info-item from the topic list of the meeting series if this item was removed within ' +
        'the last-finalized-minute', function () {

        E2ETopics.toggleInfoItemStickyState(1, 1);
        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        E2ETopics.deleteInfoItem(1, 1);
        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.countItemsForTopic(1), "the info item of the topic should have been removed").to.equal(0);
    });

});