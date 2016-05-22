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

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles).length).to.be.equal(1);
        let currentUser = e2e.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].role).to.equal("Moderator");
    });


    it('can add a further user, which defaults to "Invited" role', function () {
        let aProjectName = "E2E MSEditor User";
        let aMeetingName = "Meeting Name #2";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let user2 = e2e.settings.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles).length).to.be.equal(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal("Invited");
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;
    });


    it('can not add user twice', function () {
        let aProjectName = "E2E MSEditor User";
        let aMeetingName = "Meeting Name #3";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let user2 = e2e.settings.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);   // add first time
        browser.keys(['Enter']);
        browser.setValue('#edt_AddUser', user2);   // try to add first time
        browser.keys(['Enter']);

        expect(browser.alertText()).to.be.ok;     // expect error alert
        browser.alertAccept();

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles).length).to.be.equal(2);   // still only two!

    });


    it('can delete other user', function () {
        let aProjectName = "E2E MSEditor User";
        let aMeetingName = "Meeting Name #4";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let user2 = e2e.settings.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);   // add first time
        browser.keys(['Enter']);
        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles).length).to.be.equal(2);   // two users

        // Click on the delete button for user2
        browser.elementIdClick(usersAndRoles[user2].deleteElemId);
        usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles).length).to.be.equal(1);   // back to one user
        let currentUser = e2e.getCurrentUser(); // but current user should still be there
        expect(usersAndRoles[currentUser]).to.be.ok;
    });


    it('can not delete own user', function () {
        let aProjectName = "E2E MSEditor User";
        let aMeetingName = "Meeting Name #5";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles).length).to.be.equal(1);
        let currentUser = e2e.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].isDeletable).to.be.false;
    });


    it('can not change role of own user', function () {
        let aProjectName = "E2E MSEditor User";
        let aMeetingName = "Meeting Name #6";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles).length).to.be.equal(1);
        let currentUser = e2e.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].isReadOnly).to.be.true;
    });


    it('can promote other user to moderator', function () {
        let aProjectName = "E2E MSEditor User";
        let aMeetingName = "Meeting Name #7";
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);

        let user2 = e2e.settings.e2eTestUsers[1];
        browser.setValue('#edt_AddUser', user2);
        browser.keys(['Enter']);
        let selector = "select.user-role-select";
        let usrRoleOption = browser.selectByValue(selector, "Moderator");

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles).length).to.be.equal(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal("Moderator");
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;
    });


    // it('can configure other user back to invited role', function () {
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
    // it('can pick recently deleted user from drop-down', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #15";
    // });
    //
    //
    // it('prohibits user without access to see meeting series', function () {
    //     let aProjectName = "E2E MSEditor User";
    //     let aMeetingName = "Meeting Name #15";
    // });
});
