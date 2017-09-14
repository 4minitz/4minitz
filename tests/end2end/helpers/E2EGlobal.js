

export class E2EGlobal {
    static setValueSafe(selector, string, retries = 5) {
        let currentValue = browser.getValue(selector),
            isInteractable = true,
            count = 0;

        if (string.includes('\n')) {
            throw new Error('Entering newlines with setValueSafe is not supported.');
        }

        browser.waitForVisible(selector);

        while (count < retries && currentValue !== string) {
            try {
                isInteractable = true;
                browser.setValue(selector, string);
            } catch (e) {
                const message = e.toString(),
                    notInteractable = message.includes('Element is not currently interactable and may not be manipulated'),
                    cannotFocusElement = message.includes('Cannot focus element');

                if (notInteractable || cannotFocusElement) {
                    isInteractable = false;
                } else {
                    throw e;
                }
            }

            if (!isInteractable) {
                currentValue = browser.getValue(selector);
            }
            count++;
        }
    }

    static pollingInterval = 250;

    static waitUntil(predicate, timeout = 10000) {
        const start = new Date();
        let current = new Date();

        let i = 0;
        while (current - start < timeout) {
            try {
                predicate();
                return;
            } catch (e) {}
            browser.pause(E2EGlobal.pollingInterval);
            current = new Date();
        }

        throw new Error('waitUntil timeout');
    }

    static clickWithRetry(selector, timeout = 10000) {
        browser.scroll(selector);
        E2EGlobal.waitSomeTime(100);

        const start = new Date();
        let current = new Date();

        while (current - start < timeout) {
            try {
                browser.click(selector);
                return;
            } catch (e) {
                const message = e.toString(),
                    retryMakesSense = message.includes('Other element would receive the click')
                                   || message.includes('Element is not clickable at point');

                if (!retryMakesSense) {
                    throw e;
                }
            }
            browser.scroll(selector);
            browser.pause(E2EGlobal.pollingInterval);
            current = new Date();
        }
        throw new Error(`clickWithRetry ${selector} timeout`);
    }

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

        const weAreOnTravis = !!process.env.TRAVIS;
        if (weAreOnTravis) {
            const baseUrl = 'http://4minitz2.s3.amazonaws.com/4minitz/4minitz/',
                build = process.env.TRAVIS_BUILD_NUMBER || 1,
                job = process.env.TRAVIS_JOB_NUMBER || 1,
                url = baseUrl + '/' + build + '/' + build + '.' + job + '/tests/snapshots/' + filename + '.png';

            console.log('Screenshot taken: ', url);
        }
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
