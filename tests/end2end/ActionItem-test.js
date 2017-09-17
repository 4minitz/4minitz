import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'

require('../../imports/helpers/date');


describe('ActionItems', function () {
    const aProjectName = "E2E ActionItems";
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

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    beforeEach("make sure test user is logged in, create series and add minutes", function () {
        E2EApp.gotoStartPage();
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingName = getNewMeetingName();

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        aTopicName = getNewTopicName();
        E2ETopics.addTopicToMinutes(aTopicName);
    });

    it('can add an info item', function () {
        let topicIndex = 1;
        const actionItemName = getNewAIName();

        E2ETopics.addInfoItemToTopic({
            subject: actionItemName,
            itemType: "actionItem"
        }, topicIndex);

        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(browser.isVisible(selector), "Action item should be visible").to.be.true;

        let actionItemExpandElement = browser.element(selector).value.ELEMENT;
        let actionItemExpandElementText = browser.elementIdText(actionItemExpandElement).value;

        expect(actionItemExpandElementText, "Action item visible text should match").to.have.string(actionItemName);
    });

    it('can edit an existing action item', function() {
        let topicIndex = 1;
        const actionItemName = getNewAIName();
        const updatedActionItemName = actionItemName + ' CHANGED!';

        E2ETopics.addInfoItemToTopic({
            subject: actionItemName,
            itemType: "actionItem",
            responsible: "user1"
        }, topicIndex);

        E2EGlobal.waitSomeTime();

        E2ETopics.editInfoItemForTopic(topicIndex, 1, {subject: updatedActionItemName});

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(browser.isVisible(selector), "Action item should be visible").to.be.true;

        let actionItemExpandElement = browser.element(selector).value.ELEMENT;
        let actionItemExpandElementText = browser.elementIdText(actionItemExpandElement).value;

        expect(actionItemExpandElementText, "AI text should have changed").to.have.string(updatedActionItemName);
    });


    // This was broken before bugfix of github issue #228
    it('can edit an existing action item after an info item was added', function() {
        let topicIndex = 1;
        const actionItemName = getNewAIName();
        const updatedActionItemName = actionItemName + ' CHANGED!';

        E2ETopics.addInfoItemToTopic({      // create the initial action item
            subject: actionItemName,
            itemType: "actionItem",
            responsible: E2EGlobal.SETTINGS.e2eTestUsers[0],
        }, topicIndex);
        E2EGlobal.waitSomeTime();

        E2ETopics.addInfoItemToTopic({      // create a following info item (inserted BEFORE AI!)
            subject: "New Infoitem",
            itemType: "infoItem",
            label: "Proposal"
        }, topicIndex);
        E2EGlobal.waitSomeTime();

        const newResponsible = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let actionItemIndex = 2;    // II was inserted before AI!
        E2ETopics.editInfoItemForTopic(topicIndex, actionItemIndex,
            {
                subject: updatedActionItemName,
                itemType: "actionItem",
                responsible: newResponsible,
            });

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .topicInfoItem:nth-child(" + actionItemIndex + ")";
        expect(browser.isVisible(selector), "Action item should be visible after edit").to.be.true;

        let actionItemExpandElement = browser.element(selector).value.ELEMENT;
        let actionItemExpandElementText = browser.elementIdText(actionItemExpandElement).value;
        expect(actionItemExpandElementText, "AI subject text should have changed after edit").to.have.string(updatedActionItemName);
        expect(actionItemExpandElementText, "AI responsible should have changed after edit").to.contain(newResponsible);
    });


    it('can add an action item by pressing enter in the topic field', function () {
        let topicIndex = 1;
        E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

        const actionItemName = getNewAIName();
        E2ETopics.insertInfoItemDataIntoDialog({
            subject: actionItemName,
            itemType: "actionItem"
        });

        const subjectInput = browser.$('#id_item_subject');
        subjectInput.keys('Enter');

        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(browser.isVisible(selector), "Action item should be visible").to.be.true;

        let actionItemExpandElement = browser.element(selector).value.ELEMENT;
        let actionItemExpandElementText = browser.elementIdText(actionItemExpandElement).value;

        expect(actionItemExpandElementText, "Action item visible text should match").to.have.string(actionItemName);
    });

    it('can add an action item and set the priority field', function () {
        let topicIndex = 1;

        const actionItemName = getNewAIName();
        E2ETopics.addInfoItemToTopic({
            subject: actionItemName,
            priority: 5,
            itemType: "actionItem"
        }, topicIndex);

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        browser.waitForVisible(selector);
        expect(browser.isVisible(selector), "Action item should be visible").to.be.true;

        let actionItemExpandElement = browser.element(selector).value.ELEMENT;
        let actionItemExpandElementText = browser.elementIdText(actionItemExpandElement).value;

        expect(actionItemExpandElementText, "Action item visible text should match").to.have.string(actionItemName);
    });

    it('toggles the open-state of the first AI', function () {
        addActionItemToFirstTopic();

        E2ETopics.toggleActionItem(1, 1);

        expect(E2ETopics.isActionItemClosed(1, 1), "the AI should be closed").to.be.true;
    });

    it('toggles the open-state of the second AI', function () {
        addActionItemToFirstTopic();

        E2ETopics.addInfoItemToTopic({
            subject: getNewAIName(),
            itemType: "actionItem"
        }, 1);
        E2ETopics.toggleActionItem(1, 2);

        expect(E2ETopics.isActionItemClosed(1, 2), "the AI should be closed").to.be.true;
    });


    it('shows security question before deleting action items', function () {
        let actionItemName = addActionItemToFirstTopic();

        E2ETopics.deleteInfoItem(1, 1);

        let selectorDialog = "#confirmDialog";

        E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = browser.element(selectorDialog + " .modal-body").value.ELEMENT;
        let dialogContentText = browser.elementIdText(dialogContentElement).value;

        expect(dialogContentText, 'dialog content should display the title of the to-be-deleted object').to.have.string(actionItemName);
        expect(dialogContentText, 'dialog content should display the correct type of the to-be-deleted object').to.have.string("action item");

        // close dialog otherwise beforeEach-hook will fail!
        E2EApp.confirmationDialogAnswer(false);
    });


    it('can delete an action item', function () {
        let topicIndex = 1;
        const infoItemName = getNewAIName();
        E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "actionItem"
        }, topicIndex);

        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(browser.isVisible(selector), "Info item should be visible").to.be.true;

        E2ETopics.deleteInfoItem(1, 1, true);
        expect(browser.isVisible(selector), "Info item should be deleted").to.be.false;
    });


    it('can cancel a "delete action item"', function () {
        let topicIndex = 1;
        const infoItemName = getNewAIName();
        E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "actionItem"
        }, topicIndex);

        E2EGlobal.waitSomeTime();

        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
        expect(browser.isVisible(selector), "Info item should be visible").to.be.true;

        E2ETopics.deleteInfoItem(1, 1, false);
        expect(browser.isVisible(selector), "Info item should still exist").to.be.true;
    });
});