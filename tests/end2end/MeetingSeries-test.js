var e2e = require('./e2eHelpers');

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
    before(function () {
        e2e.resetMyApp();
        e2e.launchApp();
        e2e.loginUser(0);
    });

    after(function () {
        // Keep this as a comment for a while to see last browser state when using "chimp --watch"
        // e2e.logoutUser();
    });

    beforeEach(function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });
    

    it('can create a first meeting series @watch', function () {
        var initialCount = countMeetingSeries();
        expect(initialCount).to.equal(0);

        browser.waitForExist('#btnNewMeetingSeries');
        browser.click('#btnNewMeetingSeries');
        browser.waitForExist('input[id="id_meetingproject"]');
        browser.setValue('input[id="id_meetingproject"]', "E2E Project");
        browser.setValue('input[id="id_meetingname"]', "Meeting Name");
        browser.click('#btnAdd');
        browser.click('#btnNewMeetingSeries');

        expect(countMeetingSeries()).to.equal(1);
    });
});
