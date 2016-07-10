
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMinutesParticipants } from './helpers/E2EMinutesParticipants'


describe('MeetingSeries Editor Users', function () {
    const aProjectName = "E2E MSEditor Users";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;


    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    });

    before("reload page", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.launchApp();
        }
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });



    it('has one moderator per default', function () {
        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        let currentUser = E2EApp.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].role).to.equal(E2EGlobal.USERROLES.Moderator);
    });


    it('can add a further user, which defaults to "Invited" role', function () {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime(600);         // wait for dialog's animation

        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Invited);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;
    });


    it('can not add user twice', function () {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);  // try to add same user again!

        // For Phantom.js we skip this, as headless phantom has no alert pop-ups...
        if (! E2EGlobal.browserIsPhantomJS()) {
            expect(browser.alertText()).to.be.ok;     // expect error alert
            browser.alertAccept();
        }

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2); // still two!

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can delete other user', function () {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);   // two users

        // Click on the delete button for user2
        browser.elementIdClick(usersAndRoles[user2].deleteElemId);
        usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);

        expect(Object.keys(usersAndRoles)).to.have.length(1);   // back to one user
        let currentUser = E2EApp.getCurrentUser(); // but current user should still be there
        expect(usersAndRoles[currentUser]).to.be.ok;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can not delete own user', function () {
        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        let currentUser = E2EApp.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].isDeletable).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can not change role of own user', function () {
        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        let currentUser = E2EApp.getCurrentUser();
        expect(usersAndRoles[currentUser]).to.be.ok;
        expect(usersAndRoles[currentUser].isReadOnly).to.be.true;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can promote other user to moderator', function () {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Moderator);

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Moderator);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can configure other user back to invited role after save', function () {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Moderator);

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Moderator);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        let roleSelector = "select.user-role-select";
        browser.selectByValue(roleSelector, E2EGlobal.USERROLES.Invited);
        usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[user2]).to.be.ok;
        expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Invited);
        expect(usersAndRoles[user2].isDeletable).to.be.true;
        expect(usersAndRoles[user2].isReadOnly).to.be.false;

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can persist edited user roles to database', function () {
        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Moderator);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3);

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(3);

        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        // after save and re-open, check what was persisted
        usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(3);
        expect(usersAndRoles[currentUser], "current user").to.be.ok;                    // ... for current user
        expect(usersAndRoles[currentUser].role, "current user").to.equal(E2EGlobal.USERROLES.Moderator);
        expect(usersAndRoles[currentUser].isDeletable, "current user").to.be.false;
        expect(usersAndRoles[currentUser].isReadOnly, "current user").to.be.true;
        expect(usersAndRoles[user2], "user2").to.be.ok;                          // ... for user#2
        expect(usersAndRoles[user2].role, "user2").to.equal(E2EGlobal.USERROLES.Moderator);
        expect(usersAndRoles[user2].isDeletable, "user2").to.be.true;
        expect(usersAndRoles[user2].isReadOnly, "user2").to.be.false;
        expect(usersAndRoles[user3], "user3").to.be.ok;                          // ... for user#3
        expect(usersAndRoles[user3].role, "user3").to.equal(E2EGlobal.USERROLES.Invited);
        expect(usersAndRoles[user3].isDeletable, "user3").to.be.true;
        expect(usersAndRoles[user3].isReadOnly, "user3").to.be.false;

        browser.keys(['Escape']);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('ensures invited user can see but not edit new meeting series', function () {
        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EApp.loginUser(1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();
        expect(browser.isExisting("#btnAddMinutes")).to.be.false;

        E2EApp.loginUser();
    });


    it('ensures additional moderator user can see & edit new meeting series', function () {
        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EApp.loginUser(1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime();
        expect(browser.isExisting("#btnAddMinutes")).to.be.true;

        E2EApp.loginUser();
    });



    it('ensures moderator role can be revoked by deleting', function () {
        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        browser.elementIdClick(usersAndRoles[user2].deleteElemId);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EApp.loginUser(1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
        E2EApp.loginUser();
    });


    it('ensures that roles do not change on dialog cancel', function () {
        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Moderator);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3);

        browser.keys(['Escape']);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        browser.keys(['Escape']);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        expect(Object.keys(usersAndRoles)).to.have.length(1);
        expect(usersAndRoles[currentUser]).to.be.ok;
    });


    it('allows new invited user to access old minutes', function () {
        let myDate = "2015-03-17";  // date of first project commit ;-)

        browser.keys(['Escape']);   // cancel editor
        E2EGlobal.waitSomeTime();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EApp.loginUser(1);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;

        E2EApp.loginUser();
    });


    it('prohibits user with no access role to see meeting series', function () {
        browser.keys(['Escape']);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EApp.loginUser(1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
        E2EApp.loginUser();
    });


    it('can see other users in drop-down', function () {
        let otherRegisteredUsers = [
            E2EGlobal.SETTINGS.e2eTestUsers[1],
            E2EGlobal.SETTINGS.e2eTestUsers[2],
            E2EGlobal.SETTINGS.e2eTestUsers[3]
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

        expect(suggestedUserArray).to.include.members(otherRegisteredUsers);
        expect(otherRegisteredUsers).to.include.members(suggestedUserArray);

        browser.keys(['Escape']);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can add other users via suggestion drop-down', function () {
        // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
        browser.setValue('#edt_AddUser', "us");
        const userSuggestions = browser.elements('.tt-selectable');
        let addedUserElemId = userSuggestions.value[0].ELEMENT;  // first user in suggestion list
        let addedUserName = browser.elementIdText(addedUserElemId).value;
        browser.elementIdClick(addedUserElemId);

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        expect(Object.keys(usersAndRoles)).to.have.length(2);
        expect(usersAndRoles[addedUserName]).to.be.ok;
        expect(usersAndRoles[addedUserName].role).to.equal(E2EGlobal.USERROLES.Invited);
        expect(usersAndRoles[addedUserName].isDeletable).to.be.true;
        expect(usersAndRoles[addedUserName].isReadOnly).to.be.false;

        browser.keys(['Escape']);
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });


    it('can only pick not-already added users from drop-down', function () {
        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

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
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });



    it('can pick recently deleted user from drop-down', function () {
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
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
        E2EGlobal.waitSomeTime();         // wait for dialog's animation
    });

    it('ensures sync of invited users to participants of un-finalized minutes @watch', function () {
        let currentUser = E2EApp.getCurrentUser();
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];

        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        let participantsInfo = new E2EMinutesParticipants();
        expect(participantsInfo.getParticipantsCount(), "initial setup with 2 users").to.equal(2);
        expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()), "initial setup with user1").to.be.ok;
        expect(participantsInfo.getParticipantInfo(user2), "initial setup with user2").to.be.ok;

        // Now remove user2 and add user3
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0,1,2);
        browser.elementIdClick(usersAndRoles[user2].deleteElemId);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EMinutes.gotoLatestMinutes();
        participantsInfo = new E2EMinutesParticipants();
        expect(participantsInfo.getParticipantsCount(), "after edit still 2 users").to.equal(2);
        expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()), "after edit still with user1").to.be.ok;
        expect(participantsInfo.getParticipantInfo(user3), "after edit now with user3").to.be.ok;
    });


});
