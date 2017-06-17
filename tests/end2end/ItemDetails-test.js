import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

import { formatDateISO8601 } from '../../imports/helpers/date';


describe('Item Details', function () {
    const aProjectName = "E2E ActionItems Details";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
    let aAICounter = 0;
    let aAINameBase = "Item Name #";

    let infoItemName;

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

        infoItemName = getNewAIName();
        aTopicName = getNewTopicName();
        E2ETopics.addTopicToMinutes(aTopicName);
        E2ETopics.addInfoItemToTopic({
            subject: infoItemName,
            itemType: "actionItem"
        }, 1);
    });

    it('can add first details to a new Info Item', function() {
        const detailsText = 'First Details for Info Item';
        E2ETopics.addFirstDetailsToNewInfoItem({
            subject: getNewAIName(),
            itemType: "infoItem"
        },1 , detailsText);

        E2EGlobal.waitSomeTime();
        browser.element(".expandDetails ").click();
        E2EGlobal.waitSomeTime();

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;

        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\n' + detailsText);
    });

    it('can add details to an Action Item', function() {
        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\nNew Details');
    });

    it('can add details to an Info Item, too', function() {
        const detailsText = 'New Details for Info Item';
        E2ETopics.addInfoItemToTopic({
            subject: getNewAIName(),
            itemType: 'infoItem'
        }, 1);

        E2ETopics.addDetailsToActionItem(1, 1, detailsText);

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\n' + detailsText);
    });

    it('can add a second detail to an Action Item', function () {
        E2ETopics.addDetailsToActionItem(1, 1, 'First Details');
        E2ETopics.addDetailsToActionItem(1, 1, 'Second Details');

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value, "First added detail should be displayed")
            .to.have.string(formatDateISO8601(new Date()) + '\nFirst Details');
        expect(browser.elementIdText(firstItemOfNewTopic).value, "2nd added detail should be displayed, too")
            .to.have.string(formatDateISO8601(new Date()) + '\nSecond Details');
    });

    it('can add details to the 2nd AI of the same topic persistent', function() {
        E2ETopics.addInfoItemToTopic({
            subject: getNewAIName(),
            itemType: "actionItem"
        }, 1);
        E2ETopics.addDetailsToActionItem(1, 1, 'First Details');

        const detailsText = 'Details for the 2nd AI';

        E2ETopics.addDetailsToActionItem(1, 2, detailsText);

        browser.refresh();
        E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        E2ETopics.expandDetailsForActionItem(1, 2);

        E2EGlobal.waitSomeTime(100); // phantom.js needs some time here, too...

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let sndItemOfNewTopic = itemsOfNewTopic[1].ELEMENT;
        expect(browser.elementIdText(sndItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\n' + detailsText);
    });

    it('can edit the details of the 2nd AI of the same topic', function() {
        E2ETopics.addDetailsToActionItem(1, 1, 'First Details');

        E2ETopics.addInfoItemToTopic({
            subject: getNewAIName(),
            itemType: "actionItem"
        }, 1);
        E2ETopics.addDetailsToActionItem(1, 1, '2nd Details');

        E2ETopics.editDetailsForActionItem(1, 2, 1, "Updated Details");
        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let sndItemOfNewTopic = itemsOfNewTopic[1].ELEMENT;
        expect(browser.elementIdText(sndItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\n' + "Updated Details");
    });

    it('does not remove details when AI will be updated with the edit dialog', function () {
        const newSubject = "AI - changed subject";

        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        E2ETopics.editInfoItemForTopic(1, 1, { subject: newSubject });

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1, 1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        let completeAIText = browser.elementIdText(firstItemOfNewTopic).value;
        expect(completeAIText, "Subject of AI should have changed").to.have.string(newSubject);
        expect(completeAIText, "AI should still contain the details").to.have.string(formatDateISO8601(new Date()) + '\nNew Details');
    });

    it('does not revert changes when input field receives click-event during input', function () {
        let doBeforeSubmit = (inputElement) => {
           // perform click event on the input field after setting the text and before submitting the changes
            browser.click(inputElement);
        };

        E2ETopics.addDetailsToActionItem(1, 1, 'First Details', doBeforeSubmit);

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value, "Added detail should be displayed")
            .to.have.string(formatDateISO8601(new Date()) + '\nFirst Details');
    });

    it('can change existing details', function () {
        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        E2ETopics.editDetailsForActionItem(1, 1, 1, 'New Details (changed)');

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\nNew Details (changed)');
    });

    it('shows an confirmation dialog when removing existing details', function() {
        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        E2ETopics.editDetailsForActionItem(1, 1, 1, ''); // empty text will remove the detail

        let selectorDialog = "#confirmDialog";

        E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = browser.element(selectorDialog + " .modal-body").value.ELEMENT;
        let dialogContentText = browser.elementIdText(dialogContentElement).value;

        expect(dialogContentText, 'dialog content should display the subject of the to-be-deleted parent item')
            .to.have.string(infoItemName);

        // close dialog otherwise beforeEach-hook will fail!
        E2EApp.confirmationDialogAnswer(false);
    });

    it('should remove the details if the input field of the new item will be submitted empty', function() {
        E2ETopics.addDetailsToActionItem(1, 1, '');

        let selectorDialog = "#confirmDialog";

        E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be.false;

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value, 'the item should have not have any details')
            .to.not.have.string(formatDateISO8601(new Date()));
    });

    it('saves details persistent', function () {
        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        browser.refresh();
        E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        E2ETopics.expandDetailsForActionItem(1, 1);

        E2EGlobal.waitSomeTime(100); // phantom.js needs some time here, too...

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\nNew Details');
    });

    it('ensures that only moderator can add details', function () {
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");

        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Invited");
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save


        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();

        E2EMinutes.gotoLatestMinutes();

        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');


        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.not.have.string(formatDateISO8601(new Date()) + '\nNew Details');

        E2EApp.loginUser();
    });

    it('ensures that only moderator can change details', function () {
        E2ETopics.addDetailsToActionItem(1, 1, 'Old Details');

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");

        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Invited");
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();

        E2EMinutes.gotoLatestMinutes();

        E2ETopics.editDetailsForActionItem(1, 1, 1, 'Changed Details');


        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\nOld Details');

        E2EApp.loginUser();
    });

    it('can follow a-hyperlink in details', function() {
        E2ETopics.addDetailsToActionItem(1, 1, 'New Details with link to http://www.google.com');

        browser.click(".detailText a");
        E2EGlobal.waitSomeTime();
        console.log("new URL after click:"+browser.getUrl());
        expect(browser.getUrl()).to.contain.string("google");
    });
});