// Overrides chimp defaults from here:
// https://github.com/xolvio/chimp/blob/master/src/bin/default.js
module.exports = {
    seleniumStandaloneOptions: {
        drivers: {
            chrome: {
                version: '2.30'
            }
        }
    },
    webdriverio: {
        desiredCapabilities: {
            // chromeOptions - see: https://sites.google.com/a/chromium.org/chromedriver/capabilities
            chromeOptions: {
                prefs: {
                    "profile.default_content_settings.popups": 0,
                    // "download.default_directory" is for Attachments E2E tests to
                    // suppress the download pop up and directly save download files to disk
                    "download.default_directory": "tests/e2e_downloads"
                },
                args: ["headless", "disable-gpu", "window-size=1920x1080"]
            },
            isHeadless: true
        }
    }
};
