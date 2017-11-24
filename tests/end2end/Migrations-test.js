import {E2EApp} from './helpers/E2EApp';
import {E2EMeetingSeries} from './helpers/E2EMeetingSeries';
import {E2EMinutes} from './helpers/E2EMinutes';
import {E2ETopics} from './helpers/E2ETopics';
import {E2EGlobal} from './helpers/E2EGlobal';

describe.skip('Migrations', function () {

    const aProjectName = "Migrations";
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

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });

    it('should not change meeting series topics history when migration down and up @watch', function() {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'action item', itemType: 'actionItem'}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        E2ETopics.toggleActionItem(1, 1);
        E2ETopics.addInfoItemToTopic({subject: 'new information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'new action item', itemType: 'actionItem'}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        const checkHistory = () => {
            const url = browser.getUrl();
            const msId =  url.slice(url.lastIndexOf("/")+1);

            const topics = server.call('e2e.getTopicsOfMeetingSeries', msId);

            expect(topics.length, "Meeting Series should have one topic").to.equal(1);
            expect(topics[0].infoItems.length, "Topic should have four items").to.equal(4);
        };
        
        checkHistory(20);

        E2EGlobal.waitSomeTime(500);

        const startAtVersion = 17;
        server.call('e2e.tiggerMigration', startAtVersion);

        for (let i=startAtVersion+1; i<=21; i++) {
            server.call('e2e.tiggerMigration', i);
            console.log('migrated to version ' + i);
            E2EGlobal.waitSomeTime(1000);
        }
        checkHistory();
    });

});