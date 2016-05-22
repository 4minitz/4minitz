let e2e = require('./E2EHelpers');


describe('Minutes', function () {
    const aProjectName = "E2E Minutes";
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

    it('can add a topic to minutes @watch', function () {
        e2e.addTopicToMinutes('some topic');
        expect(e2e.countTopicsForMinute()).to.equal(1);
    });

    it('can add multiple topics @watch', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');
        expect(e2e.countTopicsForMinute()).to.equal(3);
    });


    it('multiple topics are added with latest topic at the top @watch', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');

        var topics = e2e.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('yet another topic');
    });

    it('can change the order of topics via drag and drop @watch', function () {
        e2e.addTopicToMinutes('some topic');
        e2e.addTopicToMinutes('some other topic');
        e2e.addTopicToMinutes('yet another topic');

        browser.dragAndDrop('#accordion .well:nth-child(3)', '#accordion .well:nth-child(1)');

        var topics = e2e.getTopicsForMinute();
        let elementId = topics[0].ELEMENT;
        let visibleText = browser.elementIdText(elementId).value;

        expect(visibleText).to.have.string('some topic');
    });
});
