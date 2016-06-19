import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'

require('./../../lib/helpers');


describe('Info Items', function () {
    const aProjectName = "E2E Info Items";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
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
    let getNewAIName = () => {
        aAICounter++;
        return aAINameBase + aAICounter;
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

    it('can add an info item', function () {
        let topicIndex = 1;
        const infoItemName = getNewAIName();
        E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "infoItem"
        }, topicIndex);

        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(browser.isVisible(selector), "Info item should be visible").to.be.true;

        let infoItemExpandElement = browser.element(selector).value.ELEMENT;
        let infoItemExpandElementText = browser.elementIdText(infoItemExpandElement).value;

        expect(infoItemExpandElementText, "Info item visible text should match").to.have.string(infoItemName);
    });

    it('shows security question before deleting info items', function () {
        const infoItemName = getNewAIName();
        E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "infoItem"
        }, 1);

        E2ETopics.deleteInfoItem(1, 1, /*auto confirm*/false);

        let selectorDialog = "#confirmDialog";

        E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = browser.element(selectorDialog + " .modal-body").value.ELEMENT;
        let dialogContentText = browser.elementIdText(dialogContentElement).value;

        expect(dialogContentText, 'dialog content should display the title of the to-be-deleted object').to.have.string(infoItemName);
        expect(dialogContentText, 'dialog content should display the correct type of the to-be-deleted object').to.have.string("information");

        // close dialog otherwise beforeEach-hook will fail!
        E2EApp.confirmationDialogAnswer(false);
    });

    it('can submit an info item by pressing enter in the topic field', function () {
        let topicIndex = 1;
        E2ETopics.openInfoItemDialog(topicIndex);

        const infoItemName = getNewAIName();
        E2ETopics.insertInfoItemDataIntoDialog({
            subject: infoItemName + "\n",
            itemType: "infoItem"
        });

        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(browser.isVisible(selector), "Info item should be visible").to.be.true;

        let infoItemExpandElement = browser.element(selector).value.ELEMENT;
        let infoItemExpandElementText = browser.elementIdText(infoItemExpandElement).value;

        expect(infoItemExpandElementText, "Info item visible text should match").to.have.string(infoItemName);
    });

});