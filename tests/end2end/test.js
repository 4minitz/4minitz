
function countMeetingSeries() {
    browser.waitForExist('.list-group-item');
    const elements = browser.elements('.list-group-item');
    return elements.value.length;
}


describe('list ui', function () {
    beforeEach(function () {
        // server.call('generateFixtures');

        browser.url('http://localhost:3000');           // browser = WebdriverIO instance
        if (browser.isExisting('#navbar-signout')) {
            browser.click('#navbar-signout')
        }
        try {    // try to log in
            if (browser.isExisting('#at-field-username_and_email')) {
                browser.setValue('input[id="at-field-username_and_email"]', "wok1");
                browser.setValue('input[id="at-field-password"]', "Wok1Wok1");
                browser.keys(['Enter']);
            }
        } catch (e) {
            console.log("Login failed...?!");
        }
    });

    afterEach(function () {
        if (browser.isExisting('#navbar-signout')) {
            // browser.click('#navbar-signout')
        }
    });


    it('can create a list @watch', function () {
        var initialCount = countMeetingSeries();

        browser.waitForExist('#btnNewMeetingSeries');
        browser.click('#btnNewMeetingSeries');
        browser.waitForExist('input[id="id_meetingproject"]');
        browser.setValue('input[id="id_meetingproject"]', "Project ##");
        browser.setValue('input[id="id_meetingname"]', "Name ##");
        browser.click('#btnAdd');

        console.log("countMeetingSeries() "+countMeetingSeries());
        assert.equal(countMeetingSeries(), initialCount+1);
    });
});
