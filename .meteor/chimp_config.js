module.exports = {
    webdriverio: {
        desiredCapabilities: {
            // chromeOptions - see: https://sites.google.com/a/chromium.org/chromedriver/capabilities
            chromeOptions: {
                prefs: {
                    "profile.default_content_settings.popups": 0,
                    // "download.default_directory" is for Attachments E2E tests to
                    // suppress the download pop up and directly save download files to disk
                    "download.default_directory": "tests/e2e_downloads"
                }
            }
        }
    }
};
