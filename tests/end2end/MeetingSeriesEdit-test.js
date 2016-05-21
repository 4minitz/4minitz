let e2e = require('./E2EHelpers');


describe('MeetingSeries Edit', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });
    


    it('can open and close meeting series editor', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #4a";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        // Now dialog should be there
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.true;
        browser.click('button.close');
        e2e.waitSomeTime(750); // give dialog animation time
        // Now dialog should be gone
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.false;
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });


    it('can open and cancel meeting series editor', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #4b";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        // Now dialog should be there
        expect(browser.isVisible('#btnMeetinSeriesEditCancel')).to.be.true;
        browser.click('#btnMeetinSeriesEditCancel');
        e2e.waitSomeTime(750); // give dialog animation time
        // Now dialog should be gone
        expect(browser.isVisible('#btnMeetinSeriesEditCancel')).to.be.false;
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });


    it('can delete an empty meeting series', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #5";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        let countAfterCreate = e2e.countMeetingSeries();
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        browser.click("#deleteMeetingSeries");  // Delete this Meeting Series!
        browser.waitForVisible('#confirmationDialogOK', 3000);
        browser.click("#confirmationDialogOK"); // YES, do it!
        e2e.waitSomeTime(750); // give dialog animation time

        expect(e2e.countMeetingSeries()).to.equal(countAfterCreate -1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.false;
    });


    it('can not save meeting series without project or name @watch', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #6";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        browser.setValue('input[id="id_meetingproject"]', "");  // empty input
        browser.setValue('input[id="id_meetingname"]', "");     // empty input
        browser.click("#btnMeetingSeriesSave");     // try to save
        expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.true;  // dialog still open!

        browser.setValue('input[id="id_meetingproject"]', "XXX");
        browser.setValue('input[id="id_meetingname"]', "");     // empty input
        browser.click("#btnMeetingSeriesSave");     // try to save
        expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.true;  // dialog still open!

        browser.setValue('input[id="id_meetingproject"]', "");  // empty input
        browser.setValue('input[id="id_meetingname"]', "XXX");
        browser.click("#btnMeetingSeriesSave");     // try to save
        expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.true;  // dialog still open!

        browser.click('#btnMeetinSeriesEditCancel');
        e2e.waitSomeTime(750); // give dialog animation time
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;  // prj/name should be unchanged
    });


    it('can save meeting series with new project and name @watch', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #7";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let aNewProjectName = "E2E New Project";
        let aNewMeetingName = "New Meeting Name #7b";
        browser.setValue('input[id="id_meetingproject"]', aNewProjectName);
        browser.setValue('input[id="id_meetingname"]', aNewMeetingName);
        browser.click("#btnMeetingSeriesSave");     // try to save
        e2e.waitSomeTime(750); // give dialog animation time

        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
        expect(e2e.getMeetingSeriesId(aNewProjectName, aNewMeetingName)).to.be.ok;
    });
});
