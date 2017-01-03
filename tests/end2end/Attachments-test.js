import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'


describe('Attachments @watch', function () {
    const aProjectName = "E2E Attachments";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";

    let getNewMeetingName = () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        let aMeetingName = getNewMeetingName();

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


    it('can upload an attachment if user is moderator', function () {
        browser.click("#btnAttachmentsExpand");
        E2EGlobal.waitSomeTime();
        let attachmentCount = server.call('e2e.countAttachmentsInMongoDB');
        expect(attachmentCount, "Number of attachments before upload").to.equal(0);

        let serverDir = server.call('e2e.getServerCurrentWorkingDir');  // call meteor server method
        serverDir += "/../web.browser/app/";
        let filename = serverDir + "favicon.ico";

        // Different file upload mechanisms for headless and desktop browsers
        if (E2EGlobal.browserIsPhantomJS()) {
            browser.execute(function () {
                // document.getElementById('fileInput').focus();
                $('#fileInput').attr("style", "").focus();  // remove display:none style so that focus() works
                // $('#fileInput').focus();
            });
            browser.keys(filename); // send filename as keystrokes
        } else {
            browser.chooseFile("#fileInput", filename);
        }

        E2EGlobal.waitSomeTime(250);
        E2EGlobal.saveScreenshot("AfterUpload");

        attachmentCount = server.call('e2e.countAttachmentsInMongoDB');
        expect(attachmentCount, "Number of attachments after upload").to.equal(1);
    });
});
