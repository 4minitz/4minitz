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


    it('can goto meeting series details', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #3";
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EApp.isOnStartPage()).to.be.false;
    });
});
