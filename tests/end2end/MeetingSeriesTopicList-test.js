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

    it('closes the topic if it were discussed and has no open AI', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        E2ETopics.toggleActionItem(1, 1);
        E2ETopics.toggleTopic(1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
    });

    it('remains the topic open if it were neither discussed nor has open AI', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
    });

    it('remains the topic open if it were not discussed but has no open AI', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        E2ETopics.toggleTopic(1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
    });

    it('remains the topic open if it were discussed but has open AI', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

        E2ETopics.toggleActionItem(1, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
    });

    describe('merge topics', function () {

        beforeEach('Create and finalize a first minute', function() {
            E2ETopics.addTopicToMinutes('some topic');
            E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
            E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: "actionItem"}, 1);

            E2EMinutes.finalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();
        });

        it('clears the topic list if the first minute will be un-finalized.', function() {
            E2EMinutes.gotoLatestMinutes();

            E2EMinutes.unfinalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            expect(E2ETopics.countTopicsForMinute()).to.equal(0);
        });

        it("adds new topics and AIs/IIs to the topic list of the meeting series", function () {
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

        it('closes an existing open AI but remains the topic open if it were not discussed', function () {
            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            E2ETopics.toggleActionItem(1, 1);

            E2EMinutes.finalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            expect(E2ETopics.countTopicsForMinute(), "Meeting Series should still have only one topic").to.equal(1);

            expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
            expect(E2ETopics.isActionItemClosed(1, 1), "AI should be closed").to.be.true;

        });

        it('closes an existing open AI and closes the topic if it were discussed', function () {
            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            E2ETopics.toggleActionItem(1, 1);
            E2ETopics.toggleTopic(1);

            E2EMinutes.finalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            expect(E2ETopics.countTopicsForMinute(), "Meeting Series should still have only one topic").to.equal(1);

            expect(E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
            expect(E2ETopics.isActionItemClosed(1, 1), "AI should be closed").to.be.true;
        });

        it('changes the properties (subject/responsible) of an existing Topic', function () {
            const newTopicSubject = "changed topic subject";
            const newResponsible = "user1";

            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            E2ETopics.editTopicForMinutes(1, newTopicSubject, newResponsible);

            E2EMinutes.finalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            let topicItems = E2ETopics.getTopicsForMinute();
            let topicEl = topicItems[0].ELEMENT;
            expect(browser.elementIdText(topicEl).value, "the topic subject should have changed").to.have.string(newTopicSubject);
            expect(browser.elementIdText(topicEl).value, "the topic responsible should have changed").to.have.string(newResponsible);
        });

        it('reverts property changes (subject/responsible) of a Topic if the minute will be un-finalized', function () {
            const newTopicSubject = "changed topic subject";
            const newResponsible = "user1";

            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            E2ETopics.editTopicForMinutes(1, newTopicSubject, newResponsible);

            E2EMinutes.finalizeCurrentMinutes();
            E2EMinutes.unfinalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            let topicItems = E2ETopics.getTopicsForMinute();
            let topicEl = topicItems[0].ELEMENT;
            expect(browser.elementIdText(topicEl).value, "the topic subject should have changed").to.not.have.string(newTopicSubject);
            expect(browser.elementIdText(topicEl).value, "the topic responsible should have changed").to.not.have.string(newResponsible);
        });

        it('changes the properties (subject/responsible) of an existing AI', function () {
            const newSubject = "changed action item subject";
            const newResponsible = "user1";

            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            E2ETopics.editInfoItemForTopic(1, 1, { subject: newSubject, responsible: newResponsible });

            E2EMinutes.finalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            let items = E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            expect(browser.elementIdText(firstItemElement).value, "the action item subject should have changed").to.have.string(newSubject);
            expect(browser.elementIdText(firstItemElement).value, "the action item responsible should have changed").to.have.string(newResponsible);
        });

        it('reverts property changes (subject/responsible) of an AI if the minute will be un-finalized', function () {
            const newSubject = "changed action item subject";
            const newResponsible = "user1";

            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

            E2ETopics.editInfoItemForTopic(1, 1, { subject: newSubject, responsible: newResponsible });

            E2EMinutes.finalizeCurrentMinutes();
            E2EMinutes.unfinalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            let items = E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            expect(browser.elementIdText(firstItemElement).value, "the action item subject should have changed").to.not.have.string(newSubject);
            expect(browser.elementIdText(firstItemElement).value, "the action item responsible should have changed").to.not.have.string("Resp: " + newResponsible);
        });

        it('removes the is-New-Flag of an existing topic after finalizing the 2nd minute', function () {
            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
            E2EMinutes.finalizeCurrentMinutes();
            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            let items = E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            expect(browser.elementIdText(firstItemElement).value).to.not.have.string("New");
        });

        it('restores the is-New-Flag of an existing topic after un-finalizing the 2nd minute', function () {
            // add a second minute
            E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
            E2EMinutes.finalizeCurrentMinutes();
            E2EMinutes.unfinalizeCurrentMinutes();

            E2EMinutes.gotoParentMeetingSeries();

            E2EMeetingSeries.gotoTabTopics();

            let items = E2ETopics.getItemsForTopic(1);
            let firstItemElement = items[0].ELEMENT;
            expect(browser.elementIdText(firstItemElement).value).to.have.string("New");
        });

    });

});