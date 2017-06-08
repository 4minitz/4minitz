import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';


describe('MeetingSeries', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect (E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('can create a first meeting series', function () {
        const aProjectName = "E2E Project";
        const aMeetingName = "Meeting Name #1";
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can create a further meeting series', function () {
        const aProjectName = "E2E Project";
        const aMeetingName = "Meeting Name #2";
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it.skip('can submit the form by pressing enter in the meetingname input', function () {
        const aProjectName = "E2E Project";
        const aMeetingName = "Meeting Name #2.7182818284";
        const initialCount = E2EMeetingSeries.countMeetingSeries();

        E2EMeetingSeries.editMeetingSeriesForm(aProjectName, aMeetingName + "\n");

        E2EGlobal.waitSomeTime(500);

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can not create meeting series with empty project', function () {
        const aProjectName = "";
        const aMeetingName = "Meeting Name #2.1";
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can not create meeting series with empty name', function () {
        const aProjectName = "E2E Project";
        const aMeetingName = "";
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can goto meeting series details', function () {
        const aProjectName = "E2E Project";
        const aMeetingName = "Meeting Name #4";
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EApp.isOnStartPage()).to.be.false;
    });

    it('displays the date of the last minutes in the meeting series overview', function() {
        const aProjectName = "E2E Minutes";
        const aMeetingName = "Meeting Name #4";
        const myDate = "2015-03-17";  // date of first project commit ;-)

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        E2EMeetingSeries.doSomethingWithMeetingSeriesListItem(aProjectName, aMeetingName, '', (elemId) => {
            expect(browser.elementIdText(elemId).value).to.have.string(`(last minutes of ${myDate}`);
        });
    });

    it.skip('can submit the form by pressing enter in the project name input', function () {
        let aProjectName = "E2E Project";
        let aMeetingName = "Meeting Name #4";
        let initialCount = E2EMeetingSeries.countMeetingSeries();

        E2EMeetingSeries.editMeetingSeriesForm(aProjectName + "\n", aMeetingName, true);

        E2EGlobal.waitSomeTime(500);

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });
});
