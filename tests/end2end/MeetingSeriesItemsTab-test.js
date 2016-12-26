import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('MeetingSeries Items Tab', function () {
    const aProjectName = "MeetingSeries Items Tab";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect(E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });

    before("reload page", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.launchApp();
        }
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });

    it("can filter the list of items", function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item with information', itemType: "actionItem"}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabItems();

        expect(E2ETopics.countItemsForTopic('#itemPanel'), "Items list should have three items").to.equal(3);

        // workaround: send space first, which will switch to topics-tab without adding a whitespace, then
        // the sequence 'is:item' will switch back. The first space makes sure that there will no whitespace
        // inserted after the first character.
        browser.setValue('#inputFilter', ' is:item information');
        expect(E2ETopics.countItemsForTopic('#itemPanel'), "Items list should have now two items").to.equal(2);
    });


});