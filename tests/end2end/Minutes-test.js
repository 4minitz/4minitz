let e2e = require('./E2EHelpers');


describe('Minutes', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });


    it('can add first minutes to meeting series', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #1";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        e2e.finalizeCurrentMinutes();
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });


    it('can add further minutes to meeting series', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #2";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = e2e.countMinutesForSeries(aProjectName, aMeetingName);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        e2e.finalizeCurrentMinutes();
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(countInitialMinutes +2);
    });


    it('can add minutes for specific date', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #3";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(e2e.getMinutesId(myDate)).to.be.ok;
    });


    it('can delete unfinalized minutes', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #4";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(e2e.getMinutesId(myDate)).to.be.ok;

        // Now delete it!
        e2e.gotoMinutes(myDate);
        browser.click("#btn_deleteMinutes");
        e2e.confirmationDialogAnswer(true);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);
        expect(e2e.getMinutesId(myDate)).not.to.be.ok;
    });


    it('can cancel delete of unfinalized minutes', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #5";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(e2e.getMinutesId(myDate)).to.be.ok;

        // Now trigger delete!
        e2e.gotoMinutes(myDate);
        browser.click("#btn_deleteMinutes");
        e2e.confirmationDialogAnswer(false);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(e2e.getMinutesId(myDate)).to.be.ok;
    });
});
