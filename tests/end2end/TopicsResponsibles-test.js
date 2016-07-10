import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('Topics Responsibles', function () {
    const aProjectName = "E2E Topics Responsibles";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

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


    it('can add a responsible to a topic', function () {
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
        E2ETopics.addTopicToMinutes('TOP-1', user1);

        let topicHeadingText = browser.element("#topicPanel .well:nth-child(1) h3").getText();
        expect (topicHeadingText).to.contain(user1);
    });


    it('can add two responsibles to a topic', function () {
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2ETopics.addTopicToMinutes('TOP-1', user1+","+user2);

        let topicHeadingText = browser.element("#topicPanel .well:nth-child(1) h3").getText();
        expect (topicHeadingText).to.contain(user1);
        expect (topicHeadingText).to.contain(user2);
    });


    it('can remove a responsible from a topic', function () {
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2ETopics.addTopicToMinutes('TOP-1', user1+","+user2);

        E2ETopics.openEditTopicForMinutes(1);
        browser.element(".select2-selection__choice__remove").click();  // remove first user
        browser.element(".select2-selection").click();
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime();

        let topicHeadingText = browser.element("#topicPanel .well:nth-child(1) h3").getText();
        expect (topicHeadingText).to.contain(user2);
    });


    it('can add arbitrary free text responsible name', function () {
        let username = "Max Mustermann";
        E2ETopics.addTopicToMinutes('TOP-1', username);
        let topicHeadingText = browser.element("#topicPanel .well:nth-child(1) h3").getText();
        expect (topicHeadingText).to.contain(username);
    });

    it('can add a responsible from the participant users', function () {
        let user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
        E2ETopics.addTopicToMinutes('TOP-1', "");

        E2ETopics.openEditTopicForMinutes(1);
        browser.element(".select2-selection").click();
        browser.keys("1\uE015\uE007");  // "1" (end of user1 string) + CursorDown + Enter
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime();

        let topicHeadingText = browser.element("#topicPanel .well:nth-child(1) h3").getText();
        expect (topicHeadingText).to.contain(user1);
    });




    it('can add a responsible from user collection that is not a participant', function () {
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2ETopics.addTopicToMinutes('TOP-1', "");

        E2ETopics.openEditTopicForMinutes(1);
        E2EGlobal.waitSomeTime();
        browser.element(".select2-selection").click();
        browser.keys("3\uE015\uE007");  // "3" (end of user3 string) + CursorDown + Enter
        E2EGlobal.waitSomeTime();
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime(500);

        let topicHeadingText = browser.element("#topicPanel .well:nth-child(1) h3").getText();
        expect (topicHeadingText).to.contain(user3);
    });


    it('can add a responsible from drop-down that is an additional participant', function () {
        let additionalParticipant = "Additional Participant";
        browser.setValue('#edtParticipantsAdditional', additionalParticipant);

        E2ETopics.addTopicToMinutes('TOP-1', "");

        E2ETopics.openEditTopicForMinutes(1);
        E2EGlobal.waitSomeTime();
        browser.element(".select2-selection").click();
        // We only send the beginning of the name, to ensure the drop-down is used for selection!
        browser.keys("Add\uE015\uE007");  // + CursorDown + Enter
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime();

        let topicHeadingText = browser.element("#topicPanel .well:nth-child(1) h3").getText();
        expect (topicHeadingText).to.contain(additionalParticipant);
    });
});
