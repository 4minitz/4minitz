import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'


describe('Routing', function () {
    const aProjectName = "E2E Topics";
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

    it('ensures that following a URL to a meeting series will relocate to the requested series after sign-in', function () {
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        const url = browser.getUrl();

        E2EApp.logoutUser();

        browser.url(url);

        E2EApp.loginUser(0, false);

        let selector = 'h2.header';
        let header = browser.element(selector).value.ELEMENT;
        let headerText = browser.elementIdText(header).value;
        expect(headerText).to.have.string("Meeting Series: " + aProjectName);
    });

    it('ensures that following a URL to a concrete minute will relocate to the requested minute after sign-in', function () {
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const url = browser.getUrl();

        E2EApp.logoutUser();

        browser.url(url);

        E2EApp.loginUser(0, false);

        let selector = 'h2.header';
        let header = browser.element(selector).value.ELEMENT;
        let headerText = browser.elementIdText(header).value;
        expect(headerText).to.have.string("Minutes for " + aProjectName);
    });

});