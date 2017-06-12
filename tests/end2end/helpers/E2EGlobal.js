

export class E2EGlobal {
    static waitSomeTime (milliseconds) {
        if (!milliseconds) {
            // bootstrap fade animation time is 250ms, so give this some more...  ;-)
            milliseconds = 300;
        }
        browser.pause(milliseconds);

        try {
            let max = 100;
            while (browser.isVisible('#loading-container') && max > 0) {
                E2EGlobal.saveScreenshot('loading');
                browser.pause(100);
                max--;
            }
        } catch (e) {
            // intentionally left blank.
            // sometimes Webdriver.io crashes in checking isVisible() with
            // 'TypeError: result.value.map is not a function'
            // In this case we try to keep calm and carry on...
            // Because it also tells us that there is no loading container  ;-)
        }
    }

    static formatDateISO8601 (aDate) {
        let dd = aDate.getDate();
        let mm = aDate.getMonth()+1; //January is 0!
        let yyyy = aDate.getFullYear();
        if(dd<10){
            dd='0'+dd
        }
        if(mm<10){
            mm='0'+mm
        }
        return yyyy+"-"+mm+"-"+dd;
    };

    static browserName() {
        if (browser &&
            browser._original &&
            browser._original.desiredCapabilities &&
            browser._original.desiredCapabilities.browserName) {
            return browser._original.desiredCapabilities.browserName;
        }
        console.error("Error: E2EGlobal.browserName() could not determine browserName!");
        return "unknown";
    };

    static browserIsPhantomJS() {
        return (E2EGlobal.browserName() === "phantomjs")
    };

    static isChrome() {
        if (browser &&
            browser.options &&
            browser.options.desiredCapabilities) {
            return browser.options.desiredCapabilities.browserName === 'chrome';
        }
        console.error("Error: Could not determine if the browser used is chrome!");
        return false;
    }

    static isHeadless() {
        if (browser &&
            browser.options &&
            browser.options.desiredCapabilities) {
            return browser.options.desiredCapabilities.isHeadless;
        }
        console.error("Error: Could not determine headlessness of browser!");
        return false;
    }

    static browserIsHeadlessChrome() {
        return E2EGlobal.isChrome() && E2EGlobal.isHeadless();
    };

    static isCheckboxSelected(selector) {
        let element = browser.element(selector).value;
        let checkboxId = element.ELEMENT;
        return browser.elementIdSelected(checkboxId).value;
    }

    /**
     * Takes a screen shot and saves it under
     * tests/snapshots/date[_<filename>].jpg.
     *
     * @param filename
     */
    static saveScreenshot(filename) {
        let dateStr = (new Date()).toISOString().replace(/[^0-9]/g, "") + "_";
        filename = (!filename) ? dateStr : dateStr + "_" + filename;
        browser.saveScreenshot('./tests/snapshots/' + filename + ".png");
    }
}


// Configure some static fields

E2EGlobal.SETTINGS = require('../../../settings-test-end2end.json');

E2EGlobal.USERROLES = {
    Moderator:   "Moderator",
    Invited:   "Invited",
    Uploader:  "Uploader",
    Informed:  "Informed"
};
