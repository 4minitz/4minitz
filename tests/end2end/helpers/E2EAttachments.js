const fs = require('fs-extra');
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'

import { E2EMeetingSeries } from './E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './E2EMeetingSeriesEditor'
import { E2EMinutes } from './E2EMinutes'


export class E2EAttachments {
    static expandAttachmentsArea() {
        browser.waitForExist("#btn2AttachmentsExpand");
        E2EGlobal.clickWithRetry("#btn2AttachmentsExpand");
        E2EGlobal.waitSomeTime();
    }

    static isUploadButtonVisible() {
        return browser.isVisible("#lblUpload");
    }

    static uploadFile (filename) {
        expect(fs.existsSync(filename),
            "E2EAttachments.uploadFile(): file should exist: "+filename)
            .to.be.ok;

        if (! E2EAttachments.isUploadButtonVisible()) {
            E2EAttachments.expandAttachmentsArea();
        }

        // Different file upload mechanisms for headless and desktop browsers
        if (E2EGlobal.browserIsPhantomJS()) {
            browser.execute(function () {
                $('#btnUploadAttachment').attr("style", "").focus();  // remove display:none style so that focus() works
            });
            browser.keys(filename); // send filename as keystrokes
        } else {
            browser.chooseFile("#btnUploadAttachment", filename);
        }
        E2EGlobal.waitSomeTime(1500);
    }

    static getChromeDownloadDirectory() {
        // .meteor/chimp_config.js configures chrome download dir relative to cwd()
        const chimpopts = require ('../../../.meteor/chimp_config');
        let downloadDir = chimpopts.webdriverio.desiredCapabilities.chromeOptions.prefs["download.default_directory"];
        expect(downloadDir, ".meteor/chimp_config.js must specify download.default_directory").to.be.ok;
        downloadDir = process.cwd() + "/" + downloadDir;
        return downloadDir;
    }

    static switchToUserWithDifferentRole(newRole, _projectName, _lastMeetingName) {
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(_projectName, _lastMeetingName, "invited");
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, newRole);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor(true);  // save!
        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(_projectName, _lastMeetingName);
        E2EMinutes.gotoLatestMinutes();
    }

    static countAttachmentsGlobally() {
        return server.call('e2e.countAttachmentsInMongoDB');
    }

    // execute an attachment collection count in the
    // client browser context with currently logged in user
    static countAttachmentsOnClientForCurrentUser() {
        const result = browser.execute(function () {
            const mod = require("/imports/collections/attachments_private");
            const coll = mod.AttachmentsCollection;
            return coll.find().count();
        });
        return result.value;
    }


    static getAttachmentDocsForMinuteID(minID) {
        E2EGlobal.waitSomeTime(2000);
        return server.call('e2e.getAttachmentsForMinute', minID);
    }


    static getRemoveButtons() {
        return browser.elements('button#btnDelAttachment').value;
    }

    static getDownloadLinks() {
        return browser.elements('a.linkToAttachmentDownload').value;
    }

}
