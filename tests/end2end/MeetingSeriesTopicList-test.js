import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('MeetingSeries complete Topic list', function () {
    const aProjectName = "MeetingSeries Topic List";
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

    it("copies all topics of the first minute to the parent series including both all info- and actionItems.", function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.countTopicsForMinute(), "Meeting Series should have one topic").to.equal(1);

        expect(E2ETopics.countItemsForTopic(1), "Topic should have two items").to.equal(2);

        let items = E2ETopics.getItemsForTopic(1);
        let firstItemElement = items[0].ELEMENT;
        expect(browser.elementIdText(firstItemElement).value, "fist element should be the action item").to.have.string('some action item');

        let sndElement = items[1].ELEMENT;
        expect(browser.elementIdText(sndElement).value, "2nd element should be the info item").to.have.string('some information');
    });

    it("merges topics of finalized minute into existing topic list of the meeting series @watch", function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        // add a second minute
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        // add new items (AI and II) to existing topic
        E2ETopics.addInfoItemToTopic({subject: 'some other information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some other action item', itemType: "actionItem"}, 1);

        // add a new topic
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addInfoItemToTopic({subject: 'with information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'with an action item', itemType: "actionItem"}, 1);


        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.countTopicsForMinute(), "Meeting Series should have now two topics").to.equal(2);

        // check the first topic (this should be the new one)
        expect(E2ETopics.countItemsForTopic(1), "New Topic should have two items").to.equal(2);
        let itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
        let firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
        expect(browser.elementIdText(firstItemOfNewTopic).value, "first item of new topic should be the action item")
            .to.have.string('with an action item');
        let sndItemOfNewTopic = itemsOfNewTopic[1].ELEMENT;
        expect(browser.elementIdText(sndItemOfNewTopic).value, "2nd item of new topic should be the info item")
            .to.have.string('with information');

        // check the 2nd topic (the merged one)
        expect(E2ETopics.countItemsForTopic(2), "Merged Topic should now have four items").to.equal(4);
    });

});