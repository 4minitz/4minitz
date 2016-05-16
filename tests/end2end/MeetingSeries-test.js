var e2eTestSettings = require('../../settings-test-end2end.json');
console.log("End2End Settings:");
console.log(e2eTestSettings);
console.log("# of test users:"+e2eTestSettings.e2eTestUsers.length);

function countMeetingSeries() {
    try {
        browser.waitForExist('.list-group-item');
    } catch (e) {
        return 0;   // we have no meeting series => "zero" result
    }
    const elements = browser.elements('.list-group-item');
    return elements.value.length;
}


describe('MeetingSeries', function () {
    before(function () {
        try {
            server.call('e2e.resetMyApp');
        } catch (e) {
            console.log("Exception: "+e);
            console.log("Did you forget to run the server with '--settings settings-test-end2end.json'?");
        }

        browser.url(e2eTestSettings.e2eUrl);           // browser = WebdriverIO instance
        if (browser.isExisting('#navbar-signout')) {
            browser.click('#navbar-signout')
        }
        try {    // try to log in
            if (browser.isExisting('#at-field-username_and_email')) {
                browser.setValue('input[id="at-field-username_and_email"]', e2eTestSettings.e2eTestUsers[0]);
                browser.setValue('input[id="at-field-password"]', e2eTestSettings.e2eTestPasswords[0]);
                browser.keys(['Enter']);
            }
        } catch (e) {
            console.log("Login failed...?!");
        }
    });


    after(function () {
        if (browser.isExisting('#navbar-signout')) {
            // browser.click('#navbar-signout')
        }
    });


    it('can create a new meeting series @watch', function () {
        var initialCount = countMeetingSeries();

        browser.waitForExist('#btnNewMeetingSeries');
        browser.click('#btnNewMeetingSeries');
        browser.waitForExist('input[id="id_meetingproject"]');
        browser.setValue('input[id="id_meetingproject"]', "E2E Project");
        browser.setValue('input[id="id_meetingname"]', "Meeting Name");
        browser.click('#btnAdd');
        browser.click('#btnNewMeetingSeries');

        assert.equal(countMeetingSeries(), initialCount+1);
    });
});
