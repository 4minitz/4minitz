const path = require("path");
const fs = require("fs-extra");
const md5File = require("md5-file");

import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2EAttachments } from "./helpers/E2EAttachments";

describe("Attachments", () => {
  const _projectName = "E2E Attachments";
  const _meetingNameBase = "Meeting Name #";
  let _meetingCounter = 0;
  let _lastMeetingSeriesID;
  let _lastMinutesID;
  let _lastMeetingName;
  let _localPublicDir;
  let _staticLocalFilename = "";

  const getNewMeetingName = () => {
    _meetingCounter++;
    return _meetingNameBase + _meetingCounter;
  };

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();

    _localPublicDir = server.call("e2e.getServerCurrentWorkingDir"); // call meteor server method
    _localPublicDir += "/../web.browser/app/"; // location of files from "/public" directory
    _staticLocalFilename = `${_localPublicDir}favicon.ico`;
  });

  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;

    _lastMeetingName = getNewMeetingName();
    _lastMeetingSeriesID = E2EMeetingSeries.createMeetingSeries(
      _projectName,
      _lastMeetingName,
    );
    _lastMinutesID = E2EMinutes.addMinutesToMeetingSeries(
      _projectName,
      _lastMeetingName,
    );
  });

  // ******************
  // * MODERATOR TESTS
  // ******************
  it("can upload an attachment to the server (as moderator)", () => {
    expect(
      E2EAttachments.countAttachmentsGlobally(),
      "Number of attachments before upload",
    ).to.equal(0);

    E2EAttachments.uploadFile(_staticLocalFilename);

    // check we have one attachment now in database
    expect(
      E2EAttachments.countAttachmentsGlobally(),
      "Number of attachments after upload",
    ).to.equal(1);

    // check if the server file exists after upload
    const attachment =
      E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID)[0];
    const serverAttachmentDir = server.call("e2e.getServerAttachmentsDir");
    const serverAttachmentFilename =
      serverAttachmentDir +
      "/" +
      _lastMeetingSeriesID +
      "/" +
      attachment._id +
      "." +
      attachment.extension;
    expect(
      fs.existsSync(serverAttachmentFilename),
      `Attachment file should exist on server: ${serverAttachmentFilename}`,
    ).to.be.ok;

    // check if local and server files have same MD5 checksum
    const md5local = md5File.sync(_staticLocalFilename);
    const md5server = md5File.sync(serverAttachmentFilename);
    expect(
      md5local,
      "Local file should have same MD5 checksum as server file",
    ).to.equal(md5server);
  });

  it("can not upload illegal files (as moderator)", () => {
    // wrong extension
    const fileWithDeniedExtension = `${_localPublicDir}loading-gears.gif`;
    E2EAttachments.uploadFile(fileWithDeniedExtension);
    E2EApp.confirmationDialogCheckMessage(
      'Error: Denied file extension: "gif".',
    );
    E2EApp.confirmationDialogAnswer(true);

    // to big file size
    const fileWithTooBigSize = `${_localPublicDir}mstile-310x310.png`;
    E2EAttachments.uploadFile(fileWithTooBigSize);
    E2EApp.confirmationDialogCheckMessage(
      "Error: Please upload file with max.",
    );
    E2EApp.confirmationDialogAnswer(true);
  });

  it("can remove an attachment (as moderator)", () => {
    let removeBtns = E2EAttachments.getRemoveButtons();
    expect(
      removeBtns.length,
      "Initially zero remove attachment buttons",
    ).to.equal(0);

    E2EAttachments.uploadFile(_staticLocalFilename);

    let attachmentCountInMin =
      E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID).length;
    expect(attachmentCountInMin, "One attachment after upload").to.equal(1);
    removeBtns = E2EAttachments.getRemoveButtons();
    expect(
      removeBtns.length,
      "One remove attachment buttons after upload",
    ).to.equal(1);
    // REMOVE ATTACHMENT!
    removeBtns[0].click();
    // check for security question pop up
    E2EApp.confirmationDialogCheckMessage(
      "Do you really want to delete the attachment",
    );
    E2EApp.confirmationDialogAnswer(true);
    // check attachment is really removed - from UI and in MongoDB
    attachmentCountInMin =
      E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID).length;
    expect(attachmentCountInMin, "Zero attachments after remove").to.equal(0);
    removeBtns = E2EAttachments.getRemoveButtons();
    expect(
      removeBtns.length,
      "Zero remove attachment buttons after remove",
    ).to.equal(0);
  });

  it("has correct UI on finalized minutes with attachments (as moderator)", () => {
    E2EAttachments.uploadFile(_staticLocalFilename);
    expect(
      E2EAttachments.isUploadButtonVisible(),
      "Upload button visible after upload",
    ).to.be.true;
    let removeBtns = E2EAttachments.getRemoveButtons();
    expect(
      removeBtns.length,
      "One remove attachment button after upload",
    ).to.equal(1);
    let downloadlinks = E2EAttachments.getDownloadLinks();
    expect(downloadlinks.length, "One download link after upload").to.equal(1);

    E2EMinutes.finalizeCurrentMinutes();
    expect(
      E2EAttachments.isUploadButtonVisible(),
      "No Upload button visible after finalize",
    ).to.be.false;
    removeBtns = E2EAttachments.getRemoveButtons();
    expect(
      removeBtns.length,
      "One remove attachment buttons after finalize",
    ).to.equal(0);
    downloadlinks = E2EAttachments.getDownloadLinks();
    expect(
      downloadlinks.length,
      "Still one download link after finalize",
    ).to.equal(1);
  });

  // ******************
  // * UPLOADER TESTS
  // ******************
  it("can upload an attachment to the server (as uploader)", () => {
    E2EAttachments.switchToUserWithDifferentRole(
      E2EGlobal.USERROLES.Uploader,
      _projectName,
      _lastMeetingName,
    );
    const countAttachmentsBeforeUpload =
      E2EAttachments.countAttachmentsGlobally();

    E2EAttachments.uploadFile(_staticLocalFilename);

    expect(
      E2EAttachments.countAttachmentsGlobally(),
      "Number of attachments after upload",
    ).to.equal(countAttachmentsBeforeUpload + 1);
    E2EApp.loginUser(0);
  });

  it("can remove only my own attachment (as uploader)", () => {
    // 1st Upload by Moderator
    E2EAttachments.uploadFile(_staticLocalFilename);
    const attDocBefore =
      E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID);
    E2EAttachments.switchToUserWithDifferentRole(
      E2EGlobal.USERROLES.Uploader,
      _projectName,
      _lastMeetingName,
    );

    // 2nd upload by "Uploader". We expect two attachments but only one remove button
    E2EAttachments.uploadFile(_staticLocalFilename);
    const attachmentCountInMin =
      E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID).length;
    expect(attachmentCountInMin, "Two attachment after 2nd upload").to.equal(2);
    expect(
      E2EAttachments.getRemoveButtons().length,
      "One remove attachment buttons after upload",
    ).to.equal(1);

    // REMOVE 2nd UPLOAD by Uploader!
    const removeBtns = E2EAttachments.getRemoveButtons();
    removeBtns[0].click();
    E2EApp.confirmationDialogAnswer(true);
    const attDocAfter =
      E2EAttachments.getAttachmentDocsForMinuteID(_lastMinutesID);
    expect(
      attDocBefore,
      "1st upload is still there after remove",
    ).to.deep.equal(attDocAfter);
    E2EApp.loginUser(0);
  });

  // ******************
  // * INVITED TESTS
  // ******************
  it("can not upload but sees download links (as invited)", () => {
    E2EAttachments.uploadFile(_staticLocalFilename);
    E2EAttachments.switchToUserWithDifferentRole(
      E2EGlobal.USERROLES.Invited,
      _projectName,
      _lastMeetingName,
    );

    // no need for "expanding"... it is still expanded from user1...
    expect(E2EAttachments.isUploadButtonVisible()).to.be.false;
    expect(
      E2EAttachments.getDownloadLinks().length,
      "One download link after upload by moderator",
    ).to.equal(1);

    E2EApp.loginUser(0);
  });

  // The following test downloads an attachment by clicking the download link
  // This does not work in PhantomJS - see https://github.com/ariya/phantomjs/issues/10052
  // This only works in Chrome. Chrome is configured via .meteor/chimp_config.js to
  // show no pop up dialog on saving, but instead save directly to a known target directory
  it("can download attachment via URL (as invited) - DESKTOP-CHROME-ONLY", () => {
    if (
      !E2EGlobal.browserIsPhantomJS() &&
      !E2EGlobal.browserIsHeadlessChrome()
    ) {
      E2EAttachments.uploadFile(_staticLocalFilename);
      E2EAttachments.switchToUserWithDifferentRole(
        E2EGlobal.USERROLES.Invited,
        _projectName,
        _lastMeetingName,
      );

      const fileShort = path.basename(_staticLocalFilename); // => e.g. "favicon.ico"
      const downloadDir = E2EAttachments.getChromeDownloadDirectory();
      const downloadTargetFile = path.join(downloadDir, fileShort);
      if (fs.existsSync(downloadTargetFile)) {
        fs.unlinkSync(downloadTargetFile);
      }
      expect(fs.existsSync(downloadTargetFile)).to.be.false; // No file there!

      const links = E2EAttachments.getDownloadLinks();
      links[0].click(); // now download via chrome desktop
      E2EGlobal.waitSomeTime(2000);
      expect(fs.existsSync(downloadTargetFile)).to.be.true; // File should be there
      // check if local pre-upload and local post-download files have same MD5 checksum
      const md5localPre = md5File.sync(_staticLocalFilename);
      const md5localPost = md5File.sync(downloadTargetFile);
      expect(
        md5localPre,
        "Local pre-upload file should have same MD5 checksum as local post-download file",
      ).to.equal(md5localPost);

      E2EApp.loginUser(0);
    }
  });

  // ******************
  // * NOT INVITED / NOT LOGGED IN TESTS
  // ******************

  it("has no published attachment if not invited", () => {
    E2EAttachments.uploadFile(_staticLocalFilename);
    expect(
      E2EAttachments.countAttachmentsOnClientForCurrentUser() > 0,
      "How many attachments are published to the client for user1",
    ).to.be.true;

    E2EApp.loginUser(2); // switch to non-invited user
    expect(
      E2EAttachments.countAttachmentsOnClientForCurrentUser(),
      "How many attachments are published to the client for user3",
    ).to.equal(0);
    E2EApp.loginUser(0);
  });

  it("has no published attachment if not logged in", () => {
    E2EAttachments.uploadFile(_staticLocalFilename);
    expect(
      E2EAttachments.countAttachmentsOnClientForCurrentUser() > 0,
      "How many attachments are published to the client for user1",
    ).to.be.true;

    E2EApp.logoutUser(); // log out user
    expect(
      E2EAttachments.countAttachmentsOnClientForCurrentUser(),
      "How many attachments are published to the client for non-logged in user",
    ).to.equal(0);
    E2EApp.loginUser(0);
  });

  it("can not download attachment via URL if user not invited", () => {
    E2EAttachments.uploadFile(_staticLocalFilename);
    const links = E2EAttachments.getDownloadLinks();
    const attachmentURL = links[0].getAttribute("href");

    E2EApp.loginUser(2); // switch to non-invited user
    browser.url(attachmentURL); // try to access download URL
    const htmlSource = browser.getSource();
    expect(htmlSource).to.contain("File Not Found :(");
    E2EApp.launchApp();
    E2EApp.loginUser(0);
  });

  it("can not download attachment via URL if user not logged in", () => {
    E2EAttachments.uploadFile(_staticLocalFilename);
    const links = E2EAttachments.getDownloadLinks();
    const attachmentURL = links[0].getAttribute("href");

    E2EApp.logoutUser(); // log out user
    browser.url(attachmentURL); // try to access download URL
    const htmlSource = browser.getSource();
    expect(htmlSource).to.contain("File Not Found :(");
    E2EApp.launchApp();
    E2EApp.loginUser(0);
  });
});
