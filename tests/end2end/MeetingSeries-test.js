var e2e = require('./E2EHelpers');

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
        var initialCount = countMeetingSeries();
        expect(initialCount).to.equal(0);
        e2e.createMeetingSeries("E2E Project", "Meeting Name #1");
        expect(countMeetingSeries()).to.equal(1);
        expect(e2e.getMeetingSeriesId("E2E Project", "Meeting Name #1")).not.to.be.false;
    });


    it('can create a further meeting series', function () {
        var initialCount = countMeetingSeries();
        e2e.createMeetingSeries("E2E Project", "Meeting Name #2");
        expect(countMeetingSeries()).to.equal(initialCount + 1);
        expect(e2e.getMeetingSeriesId("E2E Project", "Meeting Name #2")).not.to.be.false;
    });

    
    it('can goto meeting series details', function () {
        e2e.createMeetingSeries("E2E Project", "Meeting Name #3");
        e2e.gotoMeetingSeries("E2E Project", "Meeting Name #3");
        expect(e2e.inOnStartPage()).to.be.false;
    });


    it('can open and close meeting series editor @watch', function () {
        e2e.createMeetingSeries("E2E Project", "Meeting Name #4");
        e2e.openMeetingSeriesEditor("E2E Project", "Meeting Name #4");
        // Now dialog should be there
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.true;
        browser.click('button.close');
        e2e.waitSomeTime(750); // give dialog animation time
        // Now dialog should be gone
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.false;
    });

    it('can delete a meeting series @watch', function () {
        e2e.createMeetingSeries("E2E Project", "Meeting Name #5");
        var countAfterCreate = countMeetingSeries();
        expect(e2e.getMeetingSeriesId("E2E Project", "Meeting Name #5")).not.to.be.false;
        e2e.openMeetingSeriesEditor("E2E Project", "Meeting Name #5");

        browser.click("#deleteMeetingSeries");  // Delete this Meeting Series!
        browser.waitForVisible('#confirmationDialogOK', 3000);
        browser.click("#confirmationDialogOK"); // YES, do it!
        e2e.waitSomeTime(750); // give dialog animation time

        expect(countMeetingSeries()).to.equal(countAfterCreate -1);
        expect(e2e.getMeetingSeriesId("E2E Project", "Meeting Name #5")).to.be.false;
    });
});
