import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'


describe('Send agenda', function () {
    const aProjectName = "E2E Send Agenda";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
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

    it('displays a button send agenda on a new created minute', function() {
        expect(browser.isVisible('#btn_sendAgenda')).to.be.true;
    });

    it('ensures that the send-agenda-button is invisible for non-moderators', function() {
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");

        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Invited");
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation


        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();

        E2EMinutes.gotoLatestMinutes();
        expect(browser.isVisible('#btn_sendAgenda')).to.be.false;

        E2EApp.loginUser();
    });

    it('ensures that the send-agenda-button is invisible for finalizes minutes', function() {
        E2EMinutes.finalizeCurrentMinutes();
        expect(browser.isVisible('#btn_sendAgenda')).to.be.false;
    });

});