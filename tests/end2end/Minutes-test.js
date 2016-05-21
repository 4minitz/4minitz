let e2e = require('./E2EHelpers');


describe('Minutes', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });



    it('can add first minutes to meeting series @watch', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #1";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        e2e.finalizeCurrentMinutes();
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });


    it('can add further minutes to meeting series @watch', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #2";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = e2e.countMinutesForSeries(aProjectName, aMeetingName);

        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        e2e.finalizeCurrentMinutes();
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        e2e.finalizeCurrentMinutes();
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(countInitialMinutes +2);
    });


    it('can add minutes for specific date @watch', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #3";
        let myDate = "2015-03-17";

        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        browser.waitForVisible('#id_minutesdateInput');
        browser.setValue('#id_minutesdateInput', myDate);   // date of first commit to our project ;-)
        e2e.finalizeCurrentMinutes();
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(e2e.getMinutesId(myDate)).to.be.ok;
    });
});
