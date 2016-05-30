import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('MeetingSeries Topic History @watch', function () {
    const aProjectName = "MeetingSeries Topic History";
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

    it("copies all topics of the first minute to the parent series including all info- and actionItems.", function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabHistory();

        expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    });

});