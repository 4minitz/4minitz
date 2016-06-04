import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'

require('./../../lib/helpers');


describe('ActionItems Details', function () {
    const aProjectName = "E2E ActionItems Details";
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
            subject: getNewAIName(),
            itemType: "actionItem"
        }, 1);
    });

    it('can add details to an Action Item', function() {
        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\nNew Details');
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

    it('can change existing details', function () {
        E2ETopics.addDetailsToActionItem(1, 1, 'New Details');

        E2ETopics.changeDetailsForActionItem(1, 1, 1, 'New Details (changed)');

        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\nNew Details (changed)');
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
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Invited");
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation


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
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Invited");
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation


        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();

        E2EMinutes.gotoLatestMinutes();

        E2ETopics.changeDetailsForActionItem(1, 1, 1, 'Changed Details');


        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value)
            .to.have.string(formatDateISO8601(new Date()) + '\nOld Details');

        E2EApp.loginUser();
    });

});