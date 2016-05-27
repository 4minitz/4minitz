let e2e = require('./E2EHelpers');


describe('MeetingSeries Editor Users', function () {
    const aProjectName = "E2E MSEditor Users";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;


    beforeEach("goto start page and make sure test user is logged in", function () {
        e2e.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (e2e.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        e2e.createMeetingSeries(aProjectName, aMeetingName);
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
    });



    it('has one moderator per default', function () {
        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        let currentUser = e2e.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].role).to.equal(e2e.USERROLES.Moderator);
    });


    it('can add a further user, which defaults to "Invited" role', function () {
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime(600);         // wait for dialog's animation

        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(e2e.USERROLES.Invited);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;
    });


    it('can not add user twice', function () {
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2);
        e2e.addUserToMeetingSeries(user2);  // try to add same user again!

        // For Phantom.js we skip this, as headless phantom has no alert pop-ups...
        if (! e2e.browserIsPhantomJS()) {
            expect(browser.alertText()).to.be.ok;     // expect error alert
            browser.alertAccept();
        }

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2); // still two!

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can delete other user', function () {
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);   // two users

        // Click on the delete button for user2
        browser.elementIdClick(usersAndRoles[user2].deleteElemId);
        usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);

        expect(Object.keys(usersAndRoles)).to.have.length(1);   // back to one user
        let currentUser = e2e.getCurrentUser(); // but current user should still be there
        expect(usersAndRoles[currentUser]).to.be.ok;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can not delete own user', function () {
        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        let currentUser = e2e.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].isDeletable).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can not change role of own user', function () {
        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        let currentUser = e2e.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].isReadOnly).to.be.true;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can promote other user to moderator', function () {
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Moderator);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(e2e.USERROLES.Moderator);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can configure other user back to invited role after save', function () {
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Moderator);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(e2e.USERROLES.Moderator);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        e2e.waitSomeTime();         // wait for dialog's animation

        let roleSelector = "select.user-role-select";
        browser.selectByValue(roleSelector, e2e.USERROLES.Invited);
        usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(e2e.USERROLES.Invited);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can persist edited user roles to database', function () {
        let currentUser = e2e.getCurrentUser();
        let user2 = e2e.settings.e2eTestUsers[1];
        let user3 = e2e.settings.e2eTestUsers[2];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Moderator);
        e2e.addUserToMeetingSeries(user3);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(3);

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation
        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        e2e.waitSomeTime();         // wait for dialog's animation

        // after save and re-open, check what was persisted
        usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(3);
        expect(usersAndRoles[currentUser], "current user").to.be.ok;                    // ... for current user
        expect(usersAndRoles[currentUser].role, "current user").to.equal(e2e.USERROLES.Moderator);
        expect(usersAndRoles[currentUser].isDeletable, "current user").to.be.false;
        expect(usersAndRoles[currentUser].isReadOnly, "current user").to.be.true;
        expect(usersAndRoles[user2], "user2").to.be.ok;                          // ... for user#2
        expect(usersAndRoles[user2].role, "user2").to.equal(e2e.USERROLES.Moderator);
        expect(usersAndRoles[user2].isDeletable, "user2").to.be.true;
        expect(usersAndRoles[user2].isReadOnly, "user2").to.be.false;
        expect(usersAndRoles[user3], "user3").to.be.ok;                          // ... for user#3
        expect(usersAndRoles[user3].role, "user3").to.equal(e2e.USERROLES.Invited);
        expect(usersAndRoles[user3].isDeletable, "user3").to.be.true;
        expect(usersAndRoles[user3].isReadOnly, "user3").to.be.false;

        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('ensures invited user can see but not edit new meeting series', function () {
        let currentUser = e2e.getCurrentUser();
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Invited);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        e2e.loginUser(1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.waitSomeTime();
        expect(browser.isExisting("#btnAddMinutes")).to.be.false;

        e2e.loginUser();
    });


    it('ensures additional moderator user can see & edit new meeting series', function () {
        let currentUser = e2e.getCurrentUser();
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        e2e.loginUser(1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;

        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        e2e.waitSomeTime();
        expect(browser.isExisting("#btnAddMinutes")).to.be.true;

        e2e.loginUser();
    });



    it('ensures moderator role can be revoked by deleting', function () {
        let currentUser = e2e.getCurrentUser();
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.elementIdClick(usersAndRoles[user2].deleteElemId);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        e2e.loginUser(1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
        e2e.loginUser();
    });


    it('ensures that roles do not change on dialog cancel', function () {
        let currentUser = e2e.getCurrentUser();
        let user2 = e2e.settings.e2eTestUsers[1];
        let user3 = e2e.settings.e2eTestUsers[2];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Moderator);
        e2e.addUserToMeetingSeries(user3);

        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation

        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        expect(usersAndRoles[currentUser]).to.be.ok;
    });


    it('allows new invited user to access old minutes', function () {
        let myDate = "2015-03-17";  // date of first project commit ;-)

        browser.keys(['Escape']);   // cancel editor
        e2e.waitSomeTime();
        e2e.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        e2e.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2, e2e.USERROLES.Invited);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        e2e.waitSomeTime();         // wait for dialog's animation

        e2e.loginUser(1);
        e2e.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(e2e.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(e2e.getMinutesId(myDate)).to.be.ok;

        e2e.loginUser();
    });


    it('prohibits user with no access role to see meeting series', function () {
        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation

        e2e.loginUser(1);
        expect(e2e.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
        e2e.loginUser();
    });


    it('can see other users in drop-down', function () {
        let otherRegisteredUsers = [
            e2e.settings.e2eTestUsers[1],
            e2e.settings.e2eTestUsers[2],
            e2e.settings.e2eTestUsers[3]
        ];
        // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
        browser.setValue('#edt_AddUser', "us");
        const userSuggestions = browser.elements('.tt-selectable');
        let suggestedUserArray = [];
        for (let usrIndex in userSuggestions.value) {
            let elemId = userSuggestions.value[usrIndex].ELEMENT;
            let usrName = browser.elementIdText(elemId).value;
            suggestedUserArray.push(usrName);
        }

        expect(suggestedUserArray).to.eql(otherRegisteredUsers);    // deep-equal!

        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can add other users via suggestion drop-down', function () {
        // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
        browser.setValue('#edt_AddUser', "us");
        const userSuggestions = browser.elements('.tt-selectable');
        let addedUserElemId = userSuggestions.value[0].ELEMENT;  // first user in suggestion list
        let addedUserName = browser.elementIdText(addedUserElemId).value;
        browser.elementIdClick(addedUserElemId);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[addedUserName]).to.be.ok;
        expect(usersAndRoles[addedUserName].role).to.equal(e2e.USERROLES.Invited);
        expect(usersAndRoles[addedUserName].isDeletable).to.be.true;
        expect(usersAndRoles[addedUserName].isReadOnly).to.be.false;

        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation
    });


    it('can only pick not-already added users from drop-down', function () {
        let currentUser = e2e.getCurrentUser();
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2);

        // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
        browser.setValue('#edt_AddUser', "us");
        const userSuggestions = browser.elements('.tt-selectable');
        for (let usrIndex in userSuggestions.value) {
            let elemId = userSuggestions.value[usrIndex].ELEMENT;
            let usrName = browser.elementIdText(elemId).value;
            expect(usrName).not.to.equal(currentUser);
            expect(usrName).not.to.equal(user2);
        }

        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation
    });



    it('can pick recently deleted user from drop-down', function () {
        let user2 = e2e.settings.e2eTestUsers[1];
        e2e.addUserToMeetingSeries(user2);

        let usersAndRoles = e2e.getUsersAndRolesFromUserEditor(0,1,2);
        // Click on the delete button for user2
        browser.elementIdClick(usersAndRoles[user2].deleteElemId);

        // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
        browser.setValue('#edt_AddUser', "us");
        const userSuggestions = browser.elements('.tt-selectable');
        let suggestedUserArray = [];
        for (let usrIndex in userSuggestions.value) {
            let elemId = userSuggestions.value[usrIndex].ELEMENT;
            let usrName = browser.elementIdText(elemId).value;
            suggestedUserArray.push(usrName);
        }

        expect(suggestedUserArray).to.include(user2);

        browser.keys(['Escape']);
        e2e.waitSomeTime();         // wait for dialog's animation
    });
});
