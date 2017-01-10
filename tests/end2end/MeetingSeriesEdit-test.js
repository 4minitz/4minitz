
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'


describe('MeetingSeries Editor', function () {
    const aProjectName = "E2E MeetingSeries Editor";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
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
    

    it('can open and close meeting series editor without changing data', function () {
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        // Now dialog should be there
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.true;
        browser.click('#btnEditMSClose');
        E2EGlobal.waitSomeTime(); // give dialog animation time
        // Now dialog should be gone
        expect(browser.isVisible('#btnMeetingSeriesSave')).to.be.false;
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });


    it('can open and cancel meeting series editor without changing data', function () {
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        // Now dialog should be there
        expect(browser.isVisible('#btnMeetinSeriesEditCancel')).to.be.true;
        browser.click('#btnMeetinSeriesEditCancel');
        E2EGlobal.waitSomeTime(); // give dialog animation time
        // Now dialog should be gone
        expect(browser.isVisible('#btnMeetinSeriesEditCancel')).to.be.false;
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });


    it('can delete an empty meeting series', function () {
        let countAfterCreate = E2EMeetingSeries.countMeetingSeries();
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

        browser.click("#deleteMeetingSeries");
        E2EApp.confirmationDialogAnswer(true);

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(countAfterCreate -1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });


    it('can cancel delete of meeting series', function () {
        let countAfterCreate = E2EMeetingSeries.countMeetingSeries();
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

        browser.click("#deleteMeetingSeries");
        E2EApp.confirmationDialogAnswer(false);

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(countAfterCreate);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can clean up child minutes on deleting meeting series', function () {
        let aMeetingName = "Meeting Name (with Minute)";
        let countDBMeetingSeriesBefore = server.call('e2e.countMeetingSeriesInMongDB');
        let countDBMinutesBefore = server.call('e2e.countMinutesInMongoDB');
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.finalizeCurrentMinutes();
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        // One more Meeting series and one more minutes
        expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(countDBMeetingSeriesBefore +1);
        expect(server.call('e2e.countMinutesInMongoDB')).to.equal(countDBMinutesBefore +1);

        // Now delete meeting series with attached Minutes
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        browser.click("#deleteMeetingSeries");
        E2EApp.confirmationDialogAnswer(true);

        // Meeting series and attached minutes should be gone
        expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(countDBMeetingSeriesBefore);
        expect(server.call('e2e.countMinutesInMongoDB')).to.equal(countDBMinutesBefore);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });


    it('can not save meeting series without project or name', function () {
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
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
        E2EGlobal.waitSomeTime(750); // give dialog animation time
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;  // prj/name should be unchanged
    });


    it('can save meeting series with new project name and meeting name', function () {
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let aNewProjectName = "E2E New Project";
        let aNewMeetingName = "New Meeting Name";
        browser.setValue('input[id="id_meetingproject"]', aNewProjectName);
        browser.setValue('input[id="id_meetingname"]', aNewMeetingName);
        browser.click("#btnMeetingSeriesSave");     // try to save
        E2EGlobal.waitSomeTime(750); // give dialog animation time

        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
        expect(E2EMeetingSeries.getMeetingSeriesId(aNewProjectName, aNewMeetingName)).to.be.ok;
    });

    it('can restore fields after close and re-open', function () {
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        browser.setValue('input[id="id_meetingproject"]', aProjectName+" Changed!");
        browser.setValue('input[id="id_meetingname"]', aMeetingName + " Changed!");

        browser.click('#btnEditMSClose');
        E2EGlobal.waitSomeTime(); // give dialog animation time

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "base", true);
        expect(browser.getValue('input[id="id_meetingproject"]')).to.equal(aProjectName);
        expect(browser.getValue('input[id="id_meetingname"]')).to.equal(aMeetingName);

        browser.click('#btnEditMSClose');
        E2EGlobal.waitSomeTime(); // give dialog animation time
    });


    it('can restore fields after cancel and re-open', function () {
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        browser.setValue('input[id="id_meetingproject"]', aProjectName+" Changed!");
        browser.setValue('input[id="id_meetingname"]', aMeetingName + " Changed!");

        browser.click('#btnMeetinSeriesEditCancel');
        E2EGlobal.waitSomeTime(); // give dialog animation time

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "base", true);
        expect(browser.getValue('input[id="id_meetingproject"]')).to.equal(aProjectName);
        expect(browser.getValue('input[id="id_meetingname"]')).to.equal(aMeetingName);

        browser.click('#btnMeetinSeriesEditCancel');
        E2EGlobal.waitSomeTime(); // give dialog animation time
    });


});
