const fs = require('fs-extra');
const md5File = require('md5-file');

import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EAttachments } from './helpers/E2EAttachments'

describe('Attachments @watch', function () {
    const _projectName = "E2E Attachments";
    const _meetingNameBase = "Meeting Name #";
    let _meetingCounter = 0;
    let _lastMeetingSeriesID;
    let _lastMinutesID;
    let _staticLocalFilename = "";

    let getNewMeetingName = () => {
        _meetingCounter++;
        return _meetingNameBase + _meetingCounter;
    };

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        let aMeetingName = getNewMeetingName();

        _lastMeetingSeriesID = E2EMeetingSeries.createMeetingSeries(_projectName, aMeetingName);
        _lastMinutesID = E2EMinutes.addMinutesToMeetingSeries(_projectName, aMeetingName);
    });

    before("reload page", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.launchApp();
        }

        let serverDir = server.call('e2e.getServerCurrentWorkingDir');  // call meteor server method
        serverDir += "/../web.browser/app/"; // location of files from "/public" directory
        _staticLocalFilename = serverDir + "favicon.ico";
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });

    it('can upload an attachment if user is moderator', function () {
        let attachmentCount = server.call('e2e.countAttachmentsInMongoDB');
        expect(attachmentCount, "Number of attachments before upload").to.equal(0);

        E2EAttachments.uploadFile(_staticLocalFilename);

        // check we have one attachment now in database
        attachmentCount = server.call('e2e.countAttachmentsInMongoDB');
        expect(attachmentCount, "Number of attachments after upload").to.equal(1);

        // check if the server file exists after upload
        let attachment = server.call('e2e.getAttachmentsForMinute', _lastMinutesID)[0];
        let serverAttachmentDir = server.call('e2e.getServerAttachmentsDir');
        let serverAttachmentFilename = serverAttachmentDir +
                                "/" + _lastMeetingSeriesID +
                                "/" + attachment._id +
                                "." + attachment.extension;
        expect(fs.existsSync(serverAttachmentFilename),
                "Attachment file should exist on server: "+serverAttachmentFilename)
                .to.be.ok;

        // check if local and server files have same bytes
        const md5local = md5File.sync(_staticLocalFilename);
        const md5server = md5File.sync(serverAttachmentFilename);
        expect(md5local,
            "Local file should have same MD5 checksum as server file")
            .to.equal(md5server);
    });
});
