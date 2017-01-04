const fs = require('fs-extra');
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'

export class E2EAttachments {
    static uploadFile (filename) {
        expect(fs.existsSync(filename),
            "E2EAttachments.uploadFile(): file should exist: "+filename)
            .to.be.ok;

        browser.waitForExist("#btn2AttachmentsExpand");
        if (! browser.isVisible("#lblUpload")) {
            browser.click("#btn2AttachmentsExpand");
            E2EGlobal.waitSomeTime();
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
        E2EGlobal.waitSomeTime(250);
    }

    static countAttachmentsGlobally() {
        return server.call('e2e.countAttachmentsInMongoDB');
    }

    static getAttachmentDocsForMinuteID(minID) {
        return server.call('e2e.getAttachmentsForMinute', minID);
    }
}