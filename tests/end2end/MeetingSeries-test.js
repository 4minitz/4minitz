let e2e = require('./E2EHelpers');

describe('MeetingSeries', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });
    

    it('can create a first meeting series', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #1";
        let initialCount = e2e.countMeetingSeries();
        expect(initialCount).to.equal(0);
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMeetingSeries()).to.equal(1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can create a further meeting series', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #2";
        let initialCount = e2e.countMeetingSeries();
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMeetingSeries()).to.equal(initialCount + 1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can not create meeting series with empty project', function () {
        let aProjectName = "";
        let aMeetingName = "Meeting Name #2.1";
        let initialCount = e2e.countMeetingSeries();
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMeetingSeries()).to.equal(initialCount);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can not create meeting series with empty name', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "";
        let initialCount = e2e.countMeetingSeries();
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMeetingSeries()).to.equal(initialCount);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });


    it('can goto meeting series details', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #3";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.isOnStartPage()).to.be.false;
    });
});
