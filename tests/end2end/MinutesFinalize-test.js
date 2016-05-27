let e2e = require('./E2EHelpers');


describe('Minutes Finalize', function () {

    const aProjectName = "E2E Minutes Finalize";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });
    

    it('can finalize minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        expect(browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
        e2e.finalizeCurrentMinutes();

        expect(browser.isExisting('#btn_unfinalizeMinutes')).to.be.true;
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });

    it('asks if emails should be sent before finalizing the minute @watch', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        e2e.finalizeCurrentMinutes(/*autoConfirmDialog*/false);

        expect(browser.isExisting('#cbSendAI')).to.be.true;
        expect(browser.isExisting('#cbSendII')).to.be.true;
    });


    it('can not add minutes if unfinalized minutes exist', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

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
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

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


    it('can not delete or finalize already finalized minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        e2e.finalizeCurrentMinutes();
        e2e.gotoMinutes(myDate);

        expect(browser.isExisting("#btn_finalizeMinutes")).to.be.false;
        expect(browser.isExisting("#btn_deleteMinutes")).to.be.false;
    });


    it('can unfinalize minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        e2e.finalizeCurrentMinutes();

        browser.waitForVisible('#btn_unfinalizeMinutes');
        browser.click('#btn_unfinalizeMinutes');
        expect(browser.isExisting("#btn_finalizeMinutes")).to.be.true;
        expect(browser.isExisting("#btn_deleteMinutes")).to.be.true;
    });


    it('does show name of user that did finalize', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = "2015-03-17";  // date of first project commit ;-)
        let currentUsername = e2e.settings.e2eTestUsers[0];

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        e2e.finalizeCurrentMinutes();
        let finalizedText = browser.getText('#txt_FinalizedBy');
        expect(finalizedText).to.contain(currentUsername);

        // Now leave and re-enter minutes to trigger fresh render
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.gotoMinutes(myDate);
        finalizedText = browser.getText('#txt_FinalizedBy');
        expect(finalizedText).to.contain(currentUsername);
    });


    it('prohibits editing of finalized minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
        e2e.finalizeCurrentMinutes();

        let dateOfMinutes = browser.getValue('#id_minutesdateInput');
        expect(dateOfMinutes).to.equal(myDate);
        // try to change read-only field... we expect an exception in the next statement...  ;-)
        try {browser.setValue('#id_minutesdateInput', "2015-05-22")} catch (e) {}
        dateOfMinutes = browser.getValue('#id_minutesdateInput');
        expect(dateOfMinutes).to.equal(myDate); // still same as above?
    });


    it('prohibits unfinalizing of non-latest minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate1 = "2015-03-17";  // date of first project commit ;-)
        let myDate2 = "2015-03-18";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        e2e.finalizeCurrentMinutes();

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate2); // myDate2 is kept UNFINALIZED!

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.gotoMinutes(myDate1);
        expect(browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);  // now FINALIZE myDate2
        e2e.gotoMinutes(myDate2);
        e2e.finalizeCurrentMinutes();

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.gotoMinutes(myDate1);
        expect(browser.isExisting('#btn_unfinalizeMinutes')).to.be.false;
    });


    it('prohibits minutes on dates before the latest minutes', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate1 = "2015-03-17";  // date of first project commit ;-)
        let myDate2 = "2010-01-01";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        e2e.finalizeCurrentMinutes();

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate2);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);

        expect(e2e.getMinutesId(myDate2)).not.to.be.ok;
        let currentDateISO = e2e.formatDateISO8601(new Date());
        expect(e2e.getMinutesId(currentDateISO)).to.be.ok;
    });


    it('prohibits two minutes on the same date', function () {
        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        let myDate1 = "2015-03-17";  // date of first project commit ;-)

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        e2e.finalizeCurrentMinutes();

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);

        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(2);
        let currentDateISO = e2e.formatDateISO8601(new Date());
        expect(e2e.getMinutesId(currentDateISO)).to.be.ok;
    });
});
