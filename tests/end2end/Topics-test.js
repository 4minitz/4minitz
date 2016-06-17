import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('Topics', function () {
    const aProjectName = "E2E Topics";
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

    it('can add a topic to minutes', function () {
        E2ETopics.addTopicToMinutes('some topic');
        expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    });

    it('can add multiple topics', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');
        expect(E2ETopics.countTopicsForMinute()).to.equal(3);
    });

    it('shows security question before deleting a topic', function() {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.deleteTopic(1, /*auto-confirm-dialog*/false);

        let selectorDialog = "#confirmDialog";

        E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        let dialogContentElement = browser.element(selectorDialog + " .modal-body").value.ELEMENT;
        let dialogContentText = browser.elementIdText(dialogContentElement).value;

        expect(dialogContentText, 'dialog content should display the title of the to-be-deleted object').to.have.string('some topic');

        // close dialog otherwise beforeEach-hook will fail!
        E2EApp.confirmationDialogAnswer(false);
    });


    it('multiple topics are added with latest topic at the top', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        var topics = E2ETopics.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('yet another topic');
    });

    it('can change the order of topics via drag and drop', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        var topics = E2ETopics.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('some topic');
    });

    it('can not change the order of topics on the topics page', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        E2EMinutes.finalizeCurrentMinutes();
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        browser.click('#tab_topics');
        E2EGlobal.waitSomeTime();

        var topicsBeforeSortAttempt = E2ETopics.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        var topicsAfterSortAttempt = E2ETopics.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');
    });

    it('can not change the order of topics of finalized minutes', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        E2EMinutes.finalizeCurrentMinutes();

        var topicsBeforeSortAttempt = E2ETopics.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        var topicsAfterSortAttempt = E2ETopics.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');
    });


    it('ensures invited user can not drag-n-drop topics', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');
        
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let currentUser = E2EApp.getCurrentUser();
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
        var topicsBeforeSortAttempt = E2ETopics.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        var topicsAfterSortAttempt = E2ETopics.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');

        E2EApp.loginUser();
    });



    it('sorting of topics is persistent', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        var topicsBeforeReload = E2ETopics.getTopicsForMinute();
        let firstElementBeforeReload = topicsBeforeReload[0].ELEMENT;
        let visibleTextBeforeReload = browser.elementIdText(firstElementBeforeReload).value;
        expect(visibleTextBeforeReload).to.have.string('some topic');

        browser.refresh();
        E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        var topicsAfterReload = E2ETopics.getTopicsForMinute();
        let firstElementAfterReload = topicsAfterReload[0].ELEMENT;
        let visibleTextAfterReload = browser.elementIdText(firstElementAfterReload).value;
        expect(visibleTextAfterReload).to.have.string('some topic');
    });


    it('can collapse a topic', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        let infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(2);

        // collapse top-most topic
        browser.click('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(1);

        let firstVisibleInfoitemId = infoitems[0].ELEMENT;
        let firstVisibleInfoItemText = browser.elementIdText(firstVisibleInfoitemId).value;
        expect(firstVisibleInfoItemText).to.be.equal("InfoItem#1");
    });

    it('can collapse and re-expand a topic', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        browser.click('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        browser.click('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        let infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(2);
    });


    it('can collapse all topics', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        browser.click('#btnCollapseAll');
        let infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(0);
    });


    it('can collapse and re-expand all topics', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        browser.click('#btnCollapseAll');
        browser.click('#btnExpandAll');
        let infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(2);
    });

    it('can close topics', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        E2ETopics.toggleTopic(1);
        E2ETopics.toggleTopic(2);

        expect(E2ETopics.isTopicClosed(1), "first topic should be closed").to.be.true;
        expect(E2ETopics.isTopicClosed(2), "second topic should be closed").to.be.true;
    });

    it('is possible to mark topics as recurring persistently', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addTopicToMinutes('topic 2');

        expect(E2ETopics.isTopicRecurring(1), 'topic should not be recurring initially').to.be.false;

        E2ETopics.toggleRecurringTopic(1);

        browser.refresh();
        E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        expect(E2ETopics.isTopicRecurring(1), 'topic should be recurring').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'unchanged topic should not be recurring').to.be.false;
    });

    it('ensures that recurring topics will be displayed as recurring even in read-only-mode', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addTopicToMinutes('topic 2');

        E2ETopics.toggleRecurringTopic(1);

        E2EMinutes.finalizeCurrentMinutes();

        expect(E2ETopics.isTopicRecurring(1), 'recurring topic should be displayed as recurring').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'unchanged topic should not be displayed as recurring').to.be.false;

        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.isTopicRecurring(1), 'recurring topic should be displayed as recurring').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'unchanged topic should not be displayed as recurring').to.be.false;
    });

    it('ensures that it is not possible to change the recurring flag if topic is presented in read-only-mode', function () {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.toggleRecurringTopic(1);

        E2EMinutes.finalizeCurrentMinutes();

        E2ETopics.toggleRecurringTopic(1);
        E2ETopics.toggleRecurringTopic(2);

        expect(E2ETopics.isTopicRecurring(1), 'topic of minute should not be able to set as not-recurring if minute is finalized').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'topic of minute should not be able to set as recurring if minute is finalized').to.be.false;

        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        E2ETopics.toggleRecurringTopic(1);
        E2ETopics.toggleRecurringTopic(2);

        expect(E2ETopics.isTopicRecurring(1), 'topic of meeting series should not be able to modify in topics tab').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'topic of meeting series should not be able to set as recurring in topics tab').to.be.false;
    });

    it('ensures that a closed recurring topic should be presented in the next minute again', function () {
        const myTopicSubject = 'recurring topic';

        E2ETopics.addTopicToMinutes(myTopicSubject);
        E2ETopics.toggleRecurringTopic(1);
        E2ETopics.toggleTopic(1);

        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        var topicsOfNewMinute = E2ETopics.getTopicsForMinute();
        let firstElement = topicsOfNewMinute[0].ELEMENT;
        let visibleText = browser.elementIdText(firstElement).value;
        expect(visibleText).to.have.string(myTopicSubject);
    });

    it('ensures that the isRecurring-State of a topic in the meeting series topic list will be overwritten from the ' +
        'topics state within the last finalized minute', function () {

        const myTopicSubject = 'recurring topic';

        E2ETopics.addTopicToMinutes(myTopicSubject);
        E2ETopics.toggleRecurringTopic(1);
        E2ETopics.toggleTopic(1);

        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        E2ETopics.toggleRecurringTopic(1);
        E2ETopics.toggleTopic(1);

        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.isTopicRecurring(1)).to.be.false;
    });

});
