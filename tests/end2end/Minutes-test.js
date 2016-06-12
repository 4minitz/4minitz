import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'


describe('Minutes', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });


    it('can add first minutes to meeting series', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #1";

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.finalizeCurrentMinutes();
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });


    it('can add further minutes to meeting series', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #2";

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName);

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.finalizeCurrentMinutes();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(countInitialMinutes +2);
    });


    it('can add minutes for specific date', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #3";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;
    });


    it('can delete unfinalized minutes', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #4";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;

        // Now delete it!
        E2EMinutes.gotoMinutes(myDate);
        browser.click("#btn_deleteMinutes");
        E2EApp.confirmationDialogAnswer(true);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);
        expect(E2EMinutes.getMinutesId(myDate)).not.to.be.ok;
    });


    it('can cancel delete of unfinalized minutes', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #5";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;

        // Now trigger delete!
        E2EMinutes.gotoMinutes(myDate);
        browser.click("#btn_deleteMinutes");
        E2EApp.confirmationDialogAnswer(false);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;
    });
});
