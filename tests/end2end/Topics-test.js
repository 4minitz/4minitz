import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

describe('Topics', () => {
    const aProjectName = "E2E Topics";
    let aMeetingCounter = 0;
    const aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    before("reload page and reset app", () => {
        E2EGlobal.logTimestamp("Start test suite");
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", () => {
        E2EApp.gotoStartPage();
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });

    it('can add a topic to minutes', () => {
        E2ETopics.addTopicToMinutes('some topic');
        expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    });

    it('can add a topic to minutes at the end of topics list', () => {
        const testTopicName = 'some topic at the end';
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutesAtEnd(testTopicName);
        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        expect(E2ETopics.getLastTopicForMinute() === testTopicName);
    });

    it('can submit a new topic by pressing enter on the topic title input', () => {
        browser.waitForVisible("#id_showAddTopicDialog");
        E2EGlobal.clickWithRetry("#id_showAddTopicDialog");

        E2ETopics.insertTopicDataIntoDialog("some topic");

        const subjectInput = browser.$('#id_subject');
        subjectInput.keys('Enter');

        E2EGlobal.waitSomeTime(700);

        expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    });

    it('can add multiple topics', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');
        expect(E2ETopics.countTopicsForMinute()).to.equal(3);
    });

    it('shows security question before deleting a topic', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.deleteTopic(1);

        const selectorDialog = "#confirmDialog";

        E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be.true;

        const dialogContentElement = browser.element(`${selectorDialog} .modal-body`).value.ELEMENT;
        const dialogContentText = browser.elementIdText(dialogContentElement).value;

        expect(dialogContentText, 'dialog content should display the title of the to-be-deleted object').to.have.string('some topic');

        // close dialog otherwise beforeEach-hook will fail!
        E2EApp.confirmationDialogAnswer(false);
    });


    it('can delete a topic', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('yet another topic');
        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        E2ETopics.deleteTopic(1, true);
        expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    });


    it('can cancel a "delete topic"', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('yet another topic');
        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        E2ETopics.deleteTopic(1, false);
        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
    });


    it('multiple topics are added with latest topic at the top', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        const topics = E2ETopics.getTopicsForMinute();
        const elementId = topics[0].ELEMENT;
        const visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('yet another topic');
    });

    it.skip('can not change the order of topics via drag and drop by clicking anywhere', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        const topics = E2ETopics.getTopicsForMinute();
        const elementId = topics[0].ELEMENT;
        const visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('yet another topic');
    });

    it.skip('can change the order of topics via drag and drop by clicking on the sort icon', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        browser.waitForExist('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        browser.moveToObject('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        browser.buttonDown();
        browser.moveTo({ 1, 1 });
        browser.moveToObject('#topicPanel .well:nth-child(1)');
        browser.buttonUp();

        const topics = E2ETopics.getTopicsForMinute();
        const elementId = topics[0].ELEMENT;
        const visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('some topic');
    });

    it.skip('can not change the order of topics on the topics page', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        E2EMinutes.finalizeCurrentMinutes();
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        E2EGlobal.clickWithRetry('#tab_topics');
        E2EGlobal.waitSomeTime();

        const topicsBeforeSortAttempt = E2ETopics.getTopicsForMinute();
        const firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        const visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        const topicsAfterSortAttempt = E2ETopics.getTopicsForMinute();
        const firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        const visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');
    });

    it.skip('can not change the order of topics of finalized minutes', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        E2EMinutes.finalizeCurrentMinutes();

        const topicsBeforeSortAttempt = E2ETopics.getTopicsForMinute();
        const firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        const visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        browser.dragAndDrop('#topicPanel .well:nth-child(3)', '#topicPanel .well:nth-child(1)');

        const topicsAfterSortAttempt = E2ETopics.getTopicsForMinute();
        const firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        const visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');
    });


    it.skip('ensures invited user can not drag-n-drop topics', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");

        const currentUser = E2EApp.getCurrentUser();
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        const selector = "select.user-role-select";
        const usrRoleOption = browser.selectByValue(selector, "Invited");
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();

        E2EMinutes.gotoLatestMinutes();
        const topicsBeforeSortAttempt = E2ETopics.getTopicsForMinute();
        const firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        const visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        expect(browser.isExisting('#topicPanel .well:nth-child(3) .topicDragDropHandle')).to.be.false;

        E2EApp.loginUser();
    });


    it.skip('sorting of topics is persistent', () => {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addTopicToMinutes('yet another topic');

        browser.waitForExist('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        browser.moveToObject('#topicPanel .well:nth-child(3) .topicDragDropHandle');
        browser.buttonDown();
        browser.moveTo({ 1, 1 });
        browser.moveToObject('#topicPanel .well:nth-child(1)');
        browser.buttonUp();

        const topicsBeforeReload = E2ETopics.getTopicsForMinute();
        const firstElementBeforeReload = topicsBeforeReload[0].ELEMENT;
        const visibleTextBeforeReload = browser.elementIdText(firstElementBeforeReload).value;
        expect(visibleTextBeforeReload).to.have.string('some topic');

        browser.refresh();
        E2EGlobal.waitSomeTime(2500); // phantom.js needs some time here...

        const topicsAfterReload = E2ETopics.getTopicsForMinute();
        const firstElementAfterReload = topicsAfterReload[0].ELEMENT;
        const visibleTextAfterReload = browser.elementIdText(firstElementAfterReload).value;
        expect(visibleTextAfterReload).to.have.string('some topic');
    });


    it('can collapse a topic', () => {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        let infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(2);

        // collapse top-most topic
        E2EGlobal.clickWithRetry('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(1);

        const firstVisibleInfoitemId = infoitems[0].ELEMENT;
        const firstVisibleInfoItemText = browser.elementIdText(firstVisibleInfoitemId).value;
        expect(firstVisibleInfoItemText).to.have.string("InfoItem#1");
    });

    it('can collapse and re-expand a topic', () => {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        E2EGlobal.clickWithRetry('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        E2EGlobal.clickWithRetry('#topicPanel .well:nth-child(1) #btnTopicExpandCollapse');
        const infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(2);
    });


    it('can collapse all topics', () => {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        E2EGlobal.clickWithRetry('#btnCollapseAll');
        const infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(0);
    });


    it('can collapse and re-expand all topics', () => {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        // collapse & re-expand top-most topic
        E2EGlobal.clickWithRetry('#btnCollapseAll');
        E2EGlobal.clickWithRetry('#btnExpandAll');
        const infoitems = browser.elements(".infoitem").value;
        expect(infoitems.length).to.be.equal(2);
    });

    it('can close topics', () => {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#1",itemType: "infoItem"}, 1);
        E2ETopics.addTopicToMinutes('topic 2');
        E2ETopics.addInfoItemToTopic({subject: "InfoItem#2",itemType: "infoItem"}, 1);

        E2ETopics.toggleTopic(1);
        E2ETopics.toggleTopic(2);

        expect(E2ETopics.isTopicClosed(1), "first topic should be closed").to.be.true;
        expect(E2ETopics.isTopicClosed(2), "second topic should be closed").to.be.true;
    });

    it('is possible to mark topics as recurring persistently', () => {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addTopicToMinutes('topic 2');

        expect(E2ETopics.isTopicRecurring(1), 'topic should not be recurring initially').to.be.false;

        E2ETopics.toggleRecurringTopic(1);

        browser.refresh();
        E2EGlobal.waitSomeTime(1500); // phantom.js needs some time here...

        expect(E2ETopics.isTopicRecurring(1), 'topic should be recurring').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'unchanged topic should not be recurring').to.be.false;
    });

    it('ensures that recurring topics will be displayed as recurring even in read-only-mode', () => {
        E2ETopics.addTopicToMinutes('topic 1');
        E2ETopics.addTopicToMinutes('topic 2');

        E2ETopics.toggleRecurringTopic(1);

        E2EMinutes.finalizeCurrentMinutes();

        expect(E2ETopics.isTopicRecurring(1), 'recurring topic should be displayed as recurring after finalizing the minute').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'unchanged topic should not be displayed as recurring after finalizing the minute').to.be.false;

        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        expect(E2ETopics.isTopicRecurring(1), 'recurring topic should be displayed as recurring on topics tab').to.be.true;
        expect(E2ETopics.isTopicRecurring(2), 'unchanged topic should not be displayed as recurring on topics tab').to.be.false;
    });

    it('ensures that it is not possible to change the recurring flag if topic is presented in read-only-mode', () => {
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

    it('ensures that a closed recurring topic should be presented in the next minute again', () => {
        const myTopicSubject = 'recurring topic';

        E2ETopics.addTopicToMinutes(myTopicSubject);
        E2ETopics.toggleRecurringTopic(1);
        E2ETopics.toggleTopic(1);

        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const topicsOfNewMinute = E2ETopics.getTopicsForMinute();
        const firstElement = topicsOfNewMinute[0].ELEMENT;
        const visibleText = browser.elementIdText(firstElement).value;
        expect(visibleText).to.have.string(myTopicSubject);
    });

    it('ensures that the isRecurring-State of a topic in the meeting series topic list will be overwritten from the ' +
        'topics state within the last finalized minute', () => {

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

    it('should not be possible to insert a new topics to a meeting minutes which has the same id as an existing one ' +
        '- even not by using the meteor method directly', () => {
        const url = browser.getUrl();
        const parts = url.split('/');
        const minutesId = parts[parts.length - 1];

        const topic = {
            _id: 'nCNm3FCx4hRmp2SDQ',
            subject: 'duplicate me',
            isOpen:false,
            isRecurring:false,
            isNew:true,
            isSkipped: false,
            infoItems: [],
            labels: []
        };
        const aUser = E2EGlobal.SETTINGS.e2eTestUsers[0];
        const aPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
        server.call('login', {user: {username: aUser}, password: aPassword});

        server.call('minutes.addTopic', minutesId, topic);
        try {
            server.call('minutes.addTopic', minutesId, topic);
        } catch(e) {
            // this is expected
        }

        E2EGlobal.waitSomeTime();

        expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    });

    it('check whether labelselectionfield exists', () => {
        browser.waitForVisible("#id_showAddTopicDialog");
        E2EGlobal.clickWithRetry("#id_showAddTopicDialog");
        E2EGlobal.waitSomeTime(350);

        expect(browser.waitForExist("#id_item_selLabels")).to.be.true;
        E2EGlobal.waitSomeTime(350);
        E2EGlobal.clickWithRetry("#btnTopicCancel");
    });

    it('add label to topic via selection field', () => {
        const labelName = 'testLabel';
        E2ETopics.addTopicWithLabelToMinutes('topic', labelName);
        E2EGlobal.waitSomeTime(500);

        expect(browser.waitForExist(".topic-labels")).to.be.true;
        expect(browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('add label to topic via textbox', () => {
        const labelName = 'testLabel';
        E2ETopics.addTopicToMinutes(`topic #${labelName}`);
        E2EGlobal.waitSomeTime(500);

        expect(browser.waitForExist(".topic-labels")).to.be.true;
        expect(browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('add more (2) labels to topic via textbox', () => {
        const topicName = 'testTopic'
        const labelName1 = 'testLabel1';
        const labelName2 = 'testLabel2';
        E2ETopics.addTopicToMinutes(`${topicName} #${labelName1} #${labelName2}`);
        E2EGlobal.waitSomeTime(500);

        expect(browser.waitForExist(".topic-labels")).to.be.true;
        expect(browser.getText(".topic-labels .label:nth-child(1)")).to.equal(labelName1);
        expect(browser.getText(".topic-labels .label:nth-child(2)")).to.equal(labelName2);
    });

    it('add label to topic and check if topic is displayed in topic tab of meeting series', () => {
        const labelName = 'testLabel';
        E2ETopics.addTopicToMinutes(`topic #${labelName}`);
        E2EGlobal.waitSomeTime(500);

        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.gotoParentMeetingSeries();
        E2EMeetingSeries.gotoTabTopics();

        expect(browser.waitForExist(".topic-labels")).to.be.true;
        expect(browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('can add a topic with label to minutes at the end of topics list', () => {
        const testTopicName = 'some topic at the end';
        const labelName = 'testLabel';
        E2ETopics.addTopicToMinutes('some topic on top');
        E2ETopics.addTopicToMinutesAtEnd(`${testTopicName} #${labelName}`);
        E2EGlobal.waitSomeTime(500);

        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        expect(E2ETopics.getLastTopicForMinute() === testTopicName);
        expect(browser.waitForExist(".topic-labels")).to.be.true;
        expect(browser.getText(".topic-labels .label")).to.equal(labelName);
    });

    it('can add a topic with more (2) labels to minutes at the end of topics list', () => {
        const testTopicName = 'some topic at the end';
        const labelName1 = 'testLabel1';
        const labelName2 = 'testLabel2';
        E2ETopics.addTopicToMinutes('some topic on top');
        E2ETopics.addTopicToMinutesAtEnd(`${testTopicName} #${labelName1} #${labelName2}`);
        E2EGlobal.waitSomeTime(500);

        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        expect(E2ETopics.getLastTopicForMinute() === testTopicName);
        expect(browser.waitForExist(".labels")).to.be.true;
        expect(browser.getText(".topic-labels .label:nth-child(1)")).to.equal(labelName1);
        expect(browser.getText(".topic-labels .label:nth-child(2)")).to.equal(labelName2);
    });

    it('can add a topic with responsible to minutes at the end of topics list', () => {
        const testTopicName = 'some topic at the end';
        const responsibleName = 'TestResponsible';
        E2ETopics.addTopicToMinutes('some topic on top');
        E2ETopics.addTopicToMinutesAtEnd(`${testTopicName} @${responsibleName}`);
        E2EGlobal.waitSomeTime(500);

        const topicHeadingText = browser.element("#topicPanel .well:nth-child(2) h3").getText();

        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        expect(E2ETopics.getLastTopicForMinute() === testTopicName);
        expect (topicHeadingText).to.contain(responsibleName);
    });

    it('can add a topic with more (2) responsible to minutes at the end of topics list', () => {
        const testTopicName = 'some topic at the end';
        const responsibleName1 = 'TestResponsible1';
        const responsibleName2 = 'TestResponsible2';
        E2ETopics.addTopicToMinutes('some topic on top');
        E2ETopics.addTopicToMinutesAtEnd(`${testTopicName} @${responsibleName1} @${responsibleName2}`);
        E2EGlobal.waitSomeTime(500);

        const topicHeadingText = browser.element("#topicPanel .well:nth-child(2) h3").getText();

        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        expect(E2ETopics.getLastTopicForMinute() === testTopicName);
        expect (topicHeadingText).to.contain(responsibleName1, responsibleName2);
    });

    it('can add a topic with label and responsible to minutes at the end of topics list', () => {
        const testTopicName = 'some topic at the end';
        const labelName = 'testLabel';
        const responsibleName = 'TestResponsible';
        E2ETopics.addTopicToMinutes('some topic on top');
        E2ETopics.addTopicToMinutesAtEnd(`${testTopicName} #${labelName} @${responsibleName}`);
        E2EGlobal.waitSomeTime(500);

        const topicHeadingText = browser.element("#topicPanel .well:nth-child(2) h3").getText();

        expect(E2ETopics.countTopicsForMinute()).to.equal(2);
        expect(E2ETopics.getLastTopicForMinute() === testTopicName);
        expect(browser.waitForExist(".topic-labels")).to.be.true;
        expect(browser.getText(".topic-labels .label")).to.equal(labelName);
        expect (topicHeadingText).to.contain(responsibleName);
    });
});
