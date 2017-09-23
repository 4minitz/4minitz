import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'

describe('MyActionItems Tab', function () {
    const aProjectName = "MyActionItems Tab";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
    });

    it("can filter my action items from all meeting series @watch", function () {

        this.timeout(400000);
        var meetingName = aMeetingName + '1';
        E2EMeetingSeries.createMeetingSeries(aProjectName, meetingName);

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        E2ETopics.addTopicToMinutes('topic #1');
        E2ETopics.addInfoItemToTopic({subject: 'action item  #1', itemType: "actionItem"}, 1);
        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        E2ETopics.addTopicToMinutes('topic #2');
        E2ETopics.addInfoItemToTopic({subject: 'action item  #2', itemType: "actionItem"}, 1);
        E2EMinutes.finalizeCurrentMinutes();

        meetingName = aMeetingName + '2';
        E2EMeetingSeries.createMeetingSeries(aProjectName, meetingName);

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        E2ETopics.addTopicToMinutes('topic #3');
        E2ETopics.addInfoItemToTopic({subject: 'action item  #3', itemType: "actionItem"}, 1);
        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, meetingName);
        E2ETopics.addTopicToMinutes('topic #4');
        E2ETopics.addInfoItemToTopic({subject: 'action item  #4', itemType: "actionItem"}, 1);
        E2EMinutes.finalizeCurrentMinutes();

        E2EApp.gotoStartPage();

        E2EMeetingSeries.gotoTabItems();

        expect(E2ETopics.countItemsForTopic('#itemPanel'), "Items list should have four items").to.equal(4);

        /**browser.setValue('#inputFilter', 'information');
        expect(E2ETopics.countItemsForTopic('#itemPanel'), "Items list should have now two items").to.equal(2);**/
    });
});