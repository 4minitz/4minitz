import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'

require('./../../lib/helpers');


describe('ActionItems Responsibles', function () {
    const aProjectName = "E2E ActionItems Responsibles";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
    let aAICounter = 0;
    let aAINameBase = "Action Item Name #";

    let getNewMeetingName = () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };
    let getNewTopicName = () => {
        aTopicCounter++;
        return aTopicNameBase + aTopicCounter;
    };
    let getNewAIName = () => {
        aAICounter++;
        return aAINameBase + aAICounter;
    };

    function addActionItemToFirstTopic() {
        let actionItemName = getNewAIName();

        E2ETopics.addInfoItemToTopic({
            subject: actionItemName,
            itemType: "actionItem"
        }, 1);

        return actionItemName;
    }

    beforeEach("make sure test user is logged in, create series and add minutes", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingName = getNewMeetingName();

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        aTopicName = getNewTopicName();
        E2ETopics.addTopicToMinutes(aTopicName);
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });


    it('can add an action item with a responsibles', function () {
        let topicIndex = 1;
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];

        E2ETopics.openInfoItemDialog(topicIndex);

        const actionItemName = getNewAIName();
        E2ETopics.insertInfoItemDataIntoDialog({
            subject: actionItemName,
            itemType: "actionItem",
            responsible: user1
        });
        browser.element("#btnInfoItemSave").click();
        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        let actionItemExpandElement = browser.element(selector).value.ELEMENT;
        let actionItemExpandElementText = browser.elementIdText(actionItemExpandElement).value;

        expect(actionItemExpandElementText, "user1 shall be responsible").to.have.string(user1);
    });


    it('can add an action item with two responsibles', function () {
        let topicIndex = 1;
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];

        E2ETopics.openInfoItemDialog(topicIndex);

        const actionItemName = getNewAIName();
        E2ETopics.insertInfoItemDataIntoDialog({
            subject: actionItemName,
            itemType: "actionItem",
            responsible: user1+","+user2
        });
        browser.element("#btnInfoItemSave").click();
        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        let actionItemExpandElement = browser.element(selector).value.ELEMENT;
        let actionItemExpandElementText = browser.elementIdText(actionItemExpandElement).value;

        expect(actionItemExpandElementText, "user1 shall be responsible").to.have.string(user1);
        expect(actionItemExpandElementText, "user2 shall be responsible").to.have.string(user2);
    });
});