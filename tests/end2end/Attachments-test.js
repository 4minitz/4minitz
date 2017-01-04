const fs = require('fs-extra');
const md5File = require('md5-file');

import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EAttachments } from './helpers/E2EAttachments'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'

describe('Attachments @watch', function () {
    const _projectName = "E2E Attachments";
    const _meetingNameBase = "Meeting Name #";
    let _meetingCounter = 0;
    let _lastMeetingSeriesID;
    let _lastMinutesID;
    let _lastMeetingName;
    let _localPublicDir;
    let _staticLocalFilename = "";

    let getNewMeetingName = () => {
        _meetingCounter++;
        return _meetingNameBase + _meetingCounter;
    };

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        _lastMeetingName = getNewMeetingName();
        _lastMeetingSeriesID = E2EMeetingSeries.createMeetingSeries(_projectName, _lastMeetingName);
        _lastMinutesID = E2EMinutes.addMinutesToMeetingSeries(_projectName, _lastMeetingName);
    });

    before("reload page", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.launchApp();
        }

        _localPublicDir = server.call('e2e.getServerCurrentWorkingDir');  // call meteor server method
        _localPublicDir += "/../web.browser/app/"; // location of files from "/public" directory
        _staticLocalFilename = _localPublicDir + "favicon.ico";
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });


    // ******************
    // * MODERATOR TESTS
    // ******************
    it('can upload an attachment to the server (as moderator)', function () {
        expect(E2EAttachments.countAttachmentsGlobally(),
            "Number of attachments before upload").to.equal(0);

        E2EAttachments.uploadFile(_staticLocalFilename);

        // check we have one attachment now in database
        expect(E2EAttachments.countAttachmentsGlobally(),
            "Number of attachments after upload").to.equal(1);

        // check if the server file exists after upload
        let attachment = E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID)[0];
        let serverAttachmentDir = server.call('e2e.getServerAttachmentsDir');
        let serverAttachmentFilename = serverAttachmentDir +
                                "/" + _lastMeetingSeriesID +
                                "/" + attachment._id +
                                "." + attachment.extension;
        expect(fs.existsSync(serverAttachmentFilename),
                "Attachment file should exist on server: "+serverAttachmentFilename)
                .to.be.ok;

        // check if local and server files have same MD5 checksum
        const md5local = md5File.sync(_staticLocalFilename);
        const md5server = md5File.sync(serverAttachmentFilename);
        expect(md5local,
            "Local file should have same MD5 checksum as server file")
            .to.equal(md5server);
    });

    it('can not upload illegal files (as moderator)', function () {
        // wrong extension
        let fileWithDeniedExtension = _localPublicDir + "loading-gears.gif";
        E2EAttachments.uploadFile(fileWithDeniedExtension);
        E2EApp.confirmationDialogCheckMessage("Error: Denied file extension.");
        E2EApp.confirmationDialogAnswer(true);

        // to big file size
        let fileWithTooBigSize = _localPublicDir + "mstile-310x310.png";
        E2EAttachments.uploadFile(fileWithTooBigSize);
        E2EApp.confirmationDialogCheckMessage("Error: Please upload file with max.");
        E2EApp.confirmationDialogAnswer(true);
    });

    it('can remove an attachment (as moderator)', function () {
        let removeBtns = E2EAttachments.getRemoveButtons();
        expect(removeBtns.length, "Initially zero remove attachment buttons").to.equal(0);

        E2EAttachments.uploadFile(_staticLocalFilename);

        let attachmentCountInMin = E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID).length;
        expect(attachmentCountInMin, "One attachment after upload").to.equal(1);
        removeBtns = E2EAttachments.getRemoveButtons();
        expect(removeBtns.length, "One remove attachment buttons after upload").to.equal(1);
        // REMOVE ATTACHMENT!
        removeBtns[0].click();
        // check for security question pop up
        E2EApp.confirmationDialogCheckMessage("Do you really want to delete the attachment");
        E2EApp.confirmationDialogAnswer(true);
        // check attachment is really removed - from UI and in MongoDB
        attachmentCountInMin = E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID).length;
        expect(attachmentCountInMin, "Zero attachments after remove").to.equal(0);
        removeBtns = E2EAttachments.getRemoveButtons();
        expect(removeBtns.length, "Zero remove attachment buttons after remove").to.equal(0);
    });

    it('has correct UI on finalized minutes with attachments (as moderator)', function () {
        E2EAttachments.uploadFile(_staticLocalFilename);
        expect(E2EAttachments.isUploadButtonVisible(), "Upload button visible after upload")
            .to.be.true;
        let removeBtns = E2EAttachments.getRemoveButtons();
        expect(removeBtns.length, "One remove attachment button after upload")
            .to.equal(1);
        let downloadlinks = E2EAttachments.getDownloadLinks();
        expect(downloadlinks.length, "One download link after upload")
            .to.equal(1);

        E2EMinutes.finalizeCurrentMinutes();
        expect(E2EAttachments.isUploadButtonVisible(), "No Upload button visible after finalize")
            .to.be.false;
        removeBtns = E2EAttachments.getRemoveButtons();
        expect(removeBtns.length, "One remove attachment buttons after finalize")
            .to.equal(0);
        downloadlinks = E2EAttachments.getDownloadLinks();
        expect(downloadlinks.length, "Still one download link after finalize")
            .to.equal(1);
    });


    // ******************
    // * UPLOADER TESTS
    // ******************
    it('can upload an attachment to the server (as uploader)', function () {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(_projectName, _lastMeetingName, "invited");
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Uploader);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor(true);  // save!

        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(_projectName, _lastMeetingName);
        E2EMinutes.gotoLatestMinutes();
        let countAttachmentsBeforeUpload = E2EAttachments.countAttachmentsGlobally();

        E2EAttachments.uploadFile(_staticLocalFilename);

        expect(E2EAttachments.countAttachmentsGlobally(),
            "Number of attachments after upload").to.equal(countAttachmentsBeforeUpload +1);
        E2EApp.loginUser(0);
    });

    it('can remove only my own attachment (as uploader)', function () {
        // 1st Upload by Moderator
        E2EAttachments.uploadFile(_staticLocalFilename);
        let attDocBefore = E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID);

        // create 2nd user with role "Uploader" and login
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(_projectName, _lastMeetingName, "invited");
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Uploader);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor(true);  // save!
        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(_projectName, _lastMeetingName);
        E2EMinutes.gotoLatestMinutes();

        // 2nd upload by "Uploader". We expect two attachments but only one remove button
        E2EAttachments.uploadFile(_staticLocalFilename);
        let attachmentCountInMin = E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID).length;
        expect(attachmentCountInMin, "Two attachment after 2nd upload")
            .to.equal(2);
        expect(E2EAttachments.getRemoveButtons().length, "One remove attachment buttons after upload")
            .to.equal(1);

        // REMOVE 2nd UPLOAD by Uploader!
        let removeBtns = E2EAttachments.getRemoveButtons();
        removeBtns[0].click();
        E2EApp.confirmationDialogAnswer(true);
        let attDocAfter = E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID);
        expect(attDocBefore, "1st upload is still there after remove").to.deep.equal(attDocAfter);
        E2EApp.loginUser(0);
    });

    // ******************
    // * INVITED TESTS
    // ******************
    it('can not upload but sees download links (as invited)', function () {
        E2EAttachments.uploadFile(_staticLocalFilename);

        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(_projectName, _lastMeetingName, "invited");
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor(true);  // save!
        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(_projectName, _lastMeetingName);
        E2EMinutes.gotoLatestMinutes();

        // no need for "expanding"... it is still expanded from user1...
        expect(E2EAttachments.isUploadButtonVisible()).to.be.false;
        expect(E2EAttachments.getDownloadLinks().length, "One download link after upload by moderator")
            .to.equal(1);

        E2EApp.loginUser(0);
    });

    xit('can download attachment via URL (as invited)', function () {
        // only in Desktop!
        // not possible in PhantomJS - see https://github.com/ariya/phantomjs/issues/10052
    });


    // ******************
    // * NOT INVITED / NOT LOGGED IN TESTS
    // ******************

    xit('has no published attachment publishes if not invited', function () {
        // here...
    });

    xit('has no published attachment publishes if not logged in', function () {
        // here...
    });

    xit('can not download attachment via URL if user not invited', function () {
        // result: "File Not Found :("
    });

    xit('can not download attachment via URL if user not logged in', function () {
        // result: "File Not Found :("
    });
});
