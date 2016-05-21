let e2e = require('./E2EHelpers');


describe('Minutes Finalize', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });
    

    it('can finalize minutes', function () {
        let aProjectName = "E2E Minutes Finalize";
        let aMeetingName = "Meeting Name #1";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        expect(browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
        e2e.finalizeCurrentMinutes();

        expect(browser.isExisting('#btn_unfinalizeMinutes')).to.be.true;
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });


    it('can not add minutes if unfinalized minutes exist', function () {
        let aProjectName = "E2E Minutes Finalize";
        let aMeetingName = "Meeting Name #2";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = e2e.countMinutesForSeries(aProjectName, aMeetingName);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        // No finalize here!
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        browser.waitForVisible("#btnAddMinutes");

        // check if button is disabled
        expect(browser.isExisting('a#btnAddMinutes[disabled="true"]')).to.be.true;
        // check if button is clicked, it does not add minutes
        browser.click("#btnAddMinutes");
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(countInitialMinutes +1);
    });


    it('can finalize minutes at later timepoint', function () {
        let aProjectName = "E2E Minutes Finalize";
        let aMeetingName = "Meeting Name #3";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = e2e.countMinutesForSeries(aProjectName, aMeetingName);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        // No finalize here!
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        browser.waitForVisible("#btnAddMinutes");
        browser.click("a#id_linkToMinutes");        // goto first available minutes
        // Now finalize!
        e2e.finalizeCurrentMinutes();
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);

        // check if button is clicked, it does add 2nd minutes
        browser.click("#btnAddMinutes");
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(countInitialMinutes +2);
    });


    it('can not delete or finalize already finalized minutes @watch', function () {
        let aProjectName = "E2E Minutes Finalize";
        let aMeetingName = "Meeting Name #4";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        e2e.finalizeCurrentMinutes();
        e2e.gotoMinutes(myDate);

        expect(browser.isExisting("#btn_finalizeMinutes")).to.be.false;
        expect(browser.isExisting("#btn_deleteMinutes")).to.be.false;
    });


    it('can unfinalize minutes @watch', function () {
        let aProjectName = "E2E Minutes Finalize";
        let aMeetingName = "Meeting Name #5";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        e2e.finalizeCurrentMinutes();

        browser.waitForVisible('#btn_unfinalizeMinutes');
        browser.click('#btn_unfinalizeMinutes');
        expect(browser.isExisting("#btn_finalizeMinutes")).to.be.true;
        expect(browser.isExisting("#btn_deleteMinutes")).to.be.true;
    });
});
