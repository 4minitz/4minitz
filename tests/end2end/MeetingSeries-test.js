let e2e = require('./E2EHelpers');

console.log("End2End Settings:");
console.log("# of test users:"+e2e.settings.e2eTestUsers.length);

function countMeetingSeries() {
    try {
        browser.waitForExist('li.meeting-series-item');
    } catch (e) {
        return 0;   // we have no meeting series <li> => "zero" result
    }
    const elements = browser.elements('li.meeting-series-item');
    return elements.value.length;
}


describe('MeetingSeries', function () {
    before("reset the app database via server method and login a test user", function () {
        e2e.resetMyApp();
        e2e.launchApp();
        e2e.loginUser(0);
    });

    after("Log out test user", function () {
        // Keep this as a comment for a while to see last browser state when using "chimp --watch"
        // e2e.logoutUser();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });
    

    it('can create a first meeting series', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #1";
        let initialCount = countMeetingSeries();
        expect(initialCount).to.equal(0);
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(countMeetingSeries()).to.equal(1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });


    it('can create a further meeting series', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #2";
        let initialCount = countMeetingSeries();
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(countMeetingSeries()).to.equal(initialCount + 1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });

    
    it('can goto meeting series details', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #3";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.inOnStartPage()).to.be.false;
    });


    it('can open and close meeting series editor @watch', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #4";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        // Now dialog should be there
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.true;
        browser.click('button.close');
        e2e.waitSomeTime(750); // give dialog animation time
        // Now dialog should be gone
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.false;
    });

    it('can delete a meeting series @watch', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #5";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        let countAfterCreate = countMeetingSeries();
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        browser.click("#deleteMeetingSeries");  // Delete this Meeting Series!
        browser.waitForVisible('#confirmationDialogOK', 3000);
        browser.click("#confirmationDialogOK"); // YES, do it!
        e2e.waitSomeTime(750); // give dialog animation time

        expect(countMeetingSeries()).to.equal(countAfterCreate -1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.false;
    });
});
