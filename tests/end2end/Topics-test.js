let e2e = require('./E2EHelpers');


describe('Topics @watch', function () {
    const aProjectName = "E2E Topics";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });

    it('can add a topic to minutes', function () {
        e2e.addTopicToMinutes('some topic');
        expect(e2e.countTopicsForMinute()).to.equal(1);
    });

    it('can add multiple topics', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');
        expect(e2e.countTopicsForMinute()).to.equal(3);
    });


    it('multiple topics are added with latest topic at the top', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');

        var topics = e2e.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('yet another topic');
    });

    it('can change the order of topics via drag and drop', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');

        browser.dragAndDrop('#accordion .well:nth-child(3)', '#accordion .well:nth-child(1)');

        var topics = e2e.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('some topic');
    });

    it('can not change the order of topics on the open topics page', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');

        e2e.finalizeCurrentMinutes();
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);

        browser.click('a*=Open Topics');
        e2e.waitSomeTime();

        var topicsBeforeSortAttempt = e2e.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('some topic');

        browser.dragAndDrop('#accordion .well:nth-child(3)', '#accordion .well:nth-child(1)');

        var topicsAfterSortAttempt = e2e.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('some topic');
    });

    it('can not change the order of topics of finalized minutes', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');

        e2e.finalizeCurrentMinutes();

        var topicsBeforeSortAttempt = e2e.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        browser.dragAndDrop('#accordion .well:nth-child(3)', '#accordion .well:nth-child(1)');

        var topicsAfterSortAttempt = e2e.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');
    });


    it('ensures invited user can not drag-n-drop topics', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');
        
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let currentUser = e2e.getCurrentUser();
        let user2 = e2e.settings.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Invited");
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation


        e2e.loginUser(1);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.waitSomeTime();

        e2e.gotoLatestMinutes();
        var topicsBeforeSortAttempt = e2e.getTopicsForMinute();
        let firstElementBeforeSortAttempt = topicsBeforeSortAttempt[0].ELEMENT;
        let visibleTextBeforeSortAttempt = browser.elementIdText(firstElementBeforeSortAttempt).value;
        expect(visibleTextBeforeSortAttempt).to.have.string('yet another topic');

        browser.dragAndDrop('#accordion .well:nth-child(3)', '#accordion .well:nth-child(1)');

        var topicsAfterSortAttempt = e2e.getTopicsForMinute();
        let firstElementAfterSortAttempt = topicsAfterSortAttempt[0].ELEMENT;
        let visibleTextAfterSortAttempt = browser.elementIdText(firstElementAfterSortAttempt).value;
        expect(visibleTextAfterSortAttempt).to.have.string('yet another topic');

        e2e.loginUser();
    });



    it('sorting of topics is persistent', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');

        browser.dragAndDrop('#accordion .well:nth-child(3)', '#accordion .well:nth-child(1)');

        var topicsBeforeReload = e2e.getTopicsForMinute();
        let firstElementBeforeReload = topicsBeforeReload[0].ELEMENT;
        let visibleTextBeforeReload = browser.elementIdText(firstElementBeforeReload).value;
        expect(visibleTextBeforeReload).to.have.string('some topic');

        browser.refresh();
        e2e.waitSomeTime(1500); // phantom.js needs some time here...

        var topicsAfterReload = e2e.getTopicsForMinute();
        let firstElementAfterReload = topicsAfterReload[0].ELEMENT;
        let visibleTextAfterReload = browser.elementIdText(firstElementAfterReload).value;
        expect(visibleTextAfterReload).to.have.string('some topic');
    });
});
