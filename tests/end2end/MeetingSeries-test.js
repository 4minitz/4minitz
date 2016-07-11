import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'


describe('MeetingSeries', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.launchApp();
        }
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });
    

    it('can create a first meeting series', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #1";
        let initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can create a further meeting series', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #2";
        let initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can submit the form by pressing enter in the meetingname input', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #2.7182818284";
        let initialCount = E2EMeetingSeries.countMeetingSeries();

        E2EMeetingSeries.editMeetingSeriesForm(aProjectName, aMeetingName + "\n");

        E2EGlobal.waitSomeTime(500);

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can not create meeting series with empty project', function () {
        let aProjectName = "";
        let aMeetingName = "Meeting Name #2.1";
        let initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can not create meeting series with empty name', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "";
        let initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can create a new series and go to meeting series editor immediately', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #3";
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName, true);

        expect(browser.getUrl(), "add&invite should go to the invite-route").to.have.string('meetingseries/invite');

        E2EGlobal.waitSomeTime();
        expect(browser.waitForVisible('#dlgEditMeetingSeries')).to.be.true;

        browser.click('#btnMeetinSeriesEditCancel');
        E2EGlobal.waitSomeTime();
    });

    it('can goto meeting series details', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #4";
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EApp.isOnStartPage()).to.be.false;
    });


    it('can submit the form by pressing enter in the project name input', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #4";
        let initialCount = E2EMeetingSeries.countMeetingSeries();

        E2EMeetingSeries.editMeetingSeriesForm(aProjectName + "\n", aMeetingName, true);

        E2EGlobal.waitSomeTime(500);

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });
});
