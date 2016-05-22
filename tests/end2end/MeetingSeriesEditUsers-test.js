let e2e = require('./E2EHelpers');


describe('MeetingSeries Editor Users @watch', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;
    });
    


    it('has one moderator per default', function () {
        let aProjectName = "E2E MSEditor User";
        let aMeetingName = "Meeting Name #1";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        browser.setValue('#edt_AddUser', "user2");
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Moderator");

        browser.setValue('#edt_AddUser', "user3");
        browser.keys(['Enter']);
        browser.setValue('#edt_AddUser', "user4");
        browser.keys(['Enter']);
        e2e.getUsersAndRolesFromUserEditor(0,1,2);
    });


    // it('can add a further user', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #2";
    // });
    //
    //
    // it('can not add user twice', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #3";
    // });
    //
    //
    // it('can delete other user', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #4";
    // });
    //
    //
    // it('can not delete own user', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #5";
    // });
    //
    //
    // it('can not change role of own user', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #6";
    // });
    //
    //
    // it('can make other user to moderator', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #7";
    // });
    //
    //
    // it('can make other user to invited', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #8";
    // });
    //
    //
    // it('can add a moderator and an invited', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #9";
    // });
    //
    //
    // it('ensures correct roles on opening of dialog', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #10";
    // });
    //
    //
    // it('ensures that no roles change on dialog cancel', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #11";
    // });
    //
    //
    // it('allows new invited access to old minutes ', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #12";
    // });
    //
    //
    // it('allows new moderator access to old minutes', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #13";
    // });
    //
    //
    // it('can only pick not-already added users from drop-down', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #14";
    // });
    //
    //
    // it('can pick just deleted users from drop-down', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #15";
    // });
});
