import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMeetingSeriesEditor } from "./helpers/E2EMeetingSeriesEditor";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2EMinutesParticipants } from "./helpers/E2EMinutesParticipants";
import { E2EMails } from "./helpers/E2EMails";
import { E2ETopics } from "./helpers/E2ETopics";

describe("MeetingSeries Editor Users", () => {
  const aProjectName = "E2E MSEditor Users";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach("goto start page and make sure test user is logged in", () => {
    if (aMeetingCounter % 10 === 0) {
      E2EApp.resetMyApp(false);
      E2EApp.launchApp();
    }

    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;

    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
  });

  it("has one moderator per default", () => {
    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    expect(Object.keys(usersAndRoles)).to.have.length(1);
    const currentUser = E2EApp.getCurrentUser();
    expect(usersAndRoles[currentUser]).to.be.ok;
    expect(usersAndRoles[currentUser].role).to.equal(
      E2EGlobal.USERROLES.Moderator,
    );
  });

  it('can add a further user, which defaults to "Invited" role', () => {
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    expect(Object.keys(usersAndRoles)).to.have.length(2);
    expect(usersAndRoles[user2]).to.be.ok;
    expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Invited);
    expect(usersAndRoles[user2].isDeletable).to.be.true;
    expect(usersAndRoles[user2].isReadOnly).to.be.false;
  });

  it("can not add user twice", () => {
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2); // try to add same user again!

    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(2); // still two!

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can delete other user", () => {
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

    let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(2); // two users

    // Click on the delete button for user2
    browser.elementIdClick(usersAndRoles[user2].deleteElemId);
    usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);

    expect(Object.keys(usersAndRoles)).to.have.length(1); // back to one user
    const currentUser = E2EApp.getCurrentUser(); // but current user should still be there
    expect(usersAndRoles[currentUser]).to.be.ok;

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can not delete own user", () => {
    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);

    expect(Object.keys(usersAndRoles)).to.have.length(1);
    const currentUser = E2EApp.getCurrentUser();
    expect(usersAndRoles[currentUser]).to.be.ok;
    expect(usersAndRoles[currentUser].isDeletable).to.be.false;

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can not change role of own user", () => {
    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);

    expect(Object.keys(usersAndRoles)).to.have.length(1);
    const currentUser = E2EApp.getCurrentUser();
    expect(usersAndRoles[currentUser]).to.be.ok;
    expect(usersAndRoles[currentUser].isReadOnly).to.be.true;

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can promote other user to moderator", () => {
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Moderator,
    );

    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(2);
    expect(usersAndRoles[user2]).to.be.ok;
    expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Moderator);
    expect(usersAndRoles[user2].isDeletable).to.be.true;
    expect(usersAndRoles[user2].isReadOnly).to.be.false;

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can configure other user back to invited role after save", () => {
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Moderator,
    );

    let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(2);
    expect(usersAndRoles[user2]).to.be.ok;
    expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Moderator);
    expect(usersAndRoles[user2].isDeletable).to.be.true;
    expect(usersAndRoles[user2].isReadOnly).to.be.false;

    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );

    const roleSelector = "select.user-role-select";
    browser.selectByValue(roleSelector, E2EGlobal.USERROLES.Invited);
    usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(2);
    expect(usersAndRoles[user2]).to.be.ok;
    expect(usersAndRoles[user2].role).to.equal(E2EGlobal.USERROLES.Invited);
    expect(usersAndRoles[user2].isDeletable).to.be.true;
    expect(usersAndRoles[user2].isReadOnly).to.be.false;

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can persist edited user roles to database", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user3);

    let usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(3);

    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );

    // after save and re-open, check what was persisted
    usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(3);
    expect(usersAndRoles[currentUser], "current user").to.be.ok; // ... for current user
    expect(usersAndRoles[currentUser].role, "current user").to.equal(
      E2EGlobal.USERROLES.Moderator,
    );
    expect(usersAndRoles[currentUser].isDeletable, "current user").to.be.false;
    expect(usersAndRoles[currentUser].isReadOnly, "current user").to.be.true;
    expect(usersAndRoles[user2], "user2").to.be.ok; // ... for user#2
    expect(usersAndRoles[user2].role, "user2").to.equal(
      E2EGlobal.USERROLES.Moderator,
    );
    expect(usersAndRoles[user2].isDeletable, "user2").to.be.true;
    expect(usersAndRoles[user2].isReadOnly, "user2").to.be.false;
    expect(usersAndRoles[user3], "user3").to.be.ok; // ... for user#3
    expect(usersAndRoles[user3].role, "user3").to.equal(
      E2EGlobal.USERROLES.Invited,
    );
    expect(usersAndRoles[user3].isDeletable, "user3").to.be.true;
    expect(usersAndRoles[user3].isReadOnly, "user3").to.be.false;

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("ensures invited user can see but not edit new meeting series", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Invited,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to
      .be.ok;

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EGlobal.waitSomeTime();
    expect(browser.isExisting("#btnAddMinutes")).to.be.false;

    E2EApp.loginUser();
  });

  it("ensures additional moderator user can see & edit new meeting series", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to
      .be.ok;

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EGlobal.waitSomeTime();
    expect(browser.isExisting("#btnAddMinutes")).to.be.true;

    E2EApp.loginUser();
  });

  it("ensures moderator role can be revoked by deleting", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    browser.elementIdClick(usersAndRoles[user2].deleteElemId);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not
      .to.be.ok;
    E2EApp.loginUser();
  });

  it("ensures that roles do not change on dialog cancel", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user3);

    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);
    E2EGlobal.waitSomeTime(); // wait for dialog's animation

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);
    E2EGlobal.waitSomeTime(); // wait for dialog's animation

    expect(Object.keys(usersAndRoles)).to.have.length(1);
    expect(usersAndRoles[currentUser]).to.be.ok;
  });

  it("allows new invited user to access old minutes", () => {
    const myDate = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);
    E2EGlobal.waitSomeTime();
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Invited,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
    expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;

    E2EApp.loginUser();
  });

  it("prohibits user with no access role to see meeting series", () => {
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);
    E2EGlobal.waitSomeTime(); // wait for dialog's animation

    E2EApp.loginUser(1);
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not
      .to.be.ok;
    E2EApp.loginUser();
  });

  it("can see other users in drop-down", () => {
    const otherRegisteredUsers = [
      E2EGlobal.SETTINGS.e2eTestUsers[1],
      E2EGlobal.SETTINGS.e2eTestUsers[2],
      E2EGlobal.SETTINGS.e2eTestUsers[3],
    ];
    // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
    browser.setValue("#edt_AddUser", "us");
    const userSuggestions = browser.elements(".tt-selectable");
    const suggestedUserArray = [];
    for (const usrIndex in userSuggestions.value) {
      const elemId = userSuggestions.value[usrIndex].ELEMENT;
      const usrName = browser.elementIdText(elemId).value;
      suggestedUserArray.push(usrName);
    }

    expect(suggestedUserArray).to.include.members(otherRegisteredUsers);

    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can add other users via suggestion drop-down", () => {
    // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
    browser.setValue("#edt_AddUser", "us");
    const userSuggestions = browser.elements(".tt-selectable");
    const addedUserElemId = userSuggestions.value[0].ELEMENT; // first user in suggestion list
    const addedUserName = browser.elementIdText(addedUserElemId).value;
    browser.elementIdClick(addedUserElemId);

    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    expect(Object.keys(usersAndRoles)).to.have.length(2);
    expect(usersAndRoles[addedUserName]).to.be.ok;
    expect(usersAndRoles[addedUserName].role).to.equal(
      E2EGlobal.USERROLES.Invited,
    );
    expect(usersAndRoles[addedUserName].isDeletable).to.be.true;
    expect(usersAndRoles[addedUserName].isReadOnly).to.be.false;

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can only pick not-already added users from drop-down", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

    // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
    browser.setValue("#edt_AddUser", "us");
    const userSuggestions = browser.elements(".tt-selectable");
    for (const usrIndex in userSuggestions.value) {
      const elemId = userSuggestions.value[usrIndex].ELEMENT;
      const usrName = browser.elementIdText(elemId).value;
      expect(usrName).not.to.equal(currentUser);
      expect(usrName).not.to.equal(user2);
    }

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("can pick recently deleted user from drop-down", () => {
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);

    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    // Click on the delete button for user2
    browser.elementIdClick(usersAndRoles[user2].deleteElemId);

    // enter prefix of multiple users, to provoke twitter typeahead.js suggestions
    browser.setValue("#edt_AddUser", "us");
    const userSuggestions = browser.elements(".tt-selectable");
    const suggestedUserArray = [];
    for (const usrIndex in userSuggestions.value) {
      const elemId = userSuggestions.value[usrIndex].ELEMENT;
      const usrName = browser.elementIdText(elemId).value;
      suggestedUserArray.push(usrName);
    }

    expect(suggestedUserArray).to.include(user2);

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel"); // cancel & close editor dialog
    E2EGlobal.waitSomeTime(); // wait for dialog's animation
  });

  it("ensures sync of invited users to participants of un-finalized minutes", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];

    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    let participantsInfo = new E2EMinutesParticipants();
    expect(
      participantsInfo.getParticipantsCount(),
      "initial setup with 2 users",
    ).to.equal(2);
    expect(
      participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()),
      "initial setup with user1",
    ).to.be.ok;
    expect(
      participantsInfo.getParticipantInfo(user2),
      "initial setup with user2",
    ).to.be.ok;

    // Now remove user2 and add user3
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user3,
      E2EGlobal.USERROLES.Moderator,
    );
    const usersAndRoles = E2EMeetingSeriesEditor.getUsersAndRoles(0, 1, 2);
    browser.elementIdClick(usersAndRoles[user2].deleteElemId);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EMinutes.gotoLatestMinutes();
    participantsInfo = new E2EMinutesParticipants();
    expect(
      participantsInfo.getParticipantsCount(),
      "after edit still 2 users",
    ).to.equal(2);
    expect(
      participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()),
      "after edit still with user1",
    ).to.be.ok;
    expect(
      participantsInfo.getParticipantInfo(user3),
      "after edit now with user3",
    ).to.be.ok;
  });

  it("allows an invited user to leave a meeting series", () => {
    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Invited,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    E2EGlobal.waitSomeTime(100);
    const initialMSCount = E2EMeetingSeries.countMeetingSeries();

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EGlobal.waitSomeTime();

    E2EGlobal.clickWithRetry("#btnLeaveMeetingSeries"); // leave meeting series
    E2EApp.confirmationDialogAnswer(true);
    expect(
      E2EMeetingSeries.countMeetingSeries(),
      "minus-one visible series after leave",
    ).to.equal(initialMSCount - 1);
    expect(
      E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName),
      "Series shall be invisible after leave",
    ).not.to.be.ok;

    E2EApp.loginUser();
  });

  // this test does only make sense if mail delivery is enabled
  if (E2EGlobal.SETTINGS.email?.enableMailDelivery) {
    it("ensures informed user gets minutes email", () => {
      E2EMails.resetSentMailsDb();
      const currentUser = E2EApp.getCurrentUser();
      const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
      E2EMeetingSeriesEditor.disableEmailForRoleChange();
      E2EMeetingSeriesEditor.addUserToMeetingSeries(
        user2,
        E2EGlobal.USERROLES.Informed,
      );
      E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
      E2ETopics.addTopicToMinutes("some topic");
      E2EMinutes.finalizeCurrentMinutes(/*autoConfirmDialog*/ true);
      E2EGlobal.waitSomeTime(1000);

      const recipients = E2EMails.getAllRecipients();
      expect(recipients).to.have.length(2);
      expect(recipients).to.include.members([
        E2EGlobal.SETTINGS.e2eTestEmails[0],
        E2EGlobal.SETTINGS.e2eTestEmails[1],
      ]);
    });
  }

  it("ensures informed user can not see meeting series", function () {
    this.timeout(100000);

    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false); // close with cancel
    E2EApp.loginUser(1);
    const initialMScount = E2EMeetingSeries.countMeetingSeries();
    E2EGlobal.waitSomeTime(500);
    E2EApp.loginUser();

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Informed,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialMScount);

    E2EGlobal.waitSomeTime(500);
    E2EApp.loginUser();
  });

  it("ensures downgraded to informed user can not see meeting series anymore", function () {
    this.timeout(100000);

    const currentUser = E2EApp.getCurrentUser();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user2,
      E2EGlobal.USERROLES.Invited,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save
    E2EApp.loginUser(1);
    const initialMScount = E2EMeetingSeries.countMeetingSeries();
    E2EGlobal.waitSomeTime(500);

    E2EApp.loginUser();
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    const roleSelector = "select.user-role-select";
    browser.selectByValue(roleSelector, E2EGlobal.USERROLES.Informed);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save
    E2EApp.loginUser(1);
    expect(
      E2EMeetingSeries.countMeetingSeries(),
      "MS count should be minus one",
    ).to.equal(initialMScount - 1);
    E2EGlobal.waitSomeTime(500);

    E2EApp.loginUser();
  });

  it("ensures participants gets E-Mail on role change", () => {
    // Clear mails
    E2EMails.resetSentMailsDb();

    // Add user
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

    //check emais
    const recipients = E2EMails.getAllRecipients();
    expect(recipients).to.have.length(1);
  });

  it("ensures participants does not get an E-Mail if roles stay the same", () => {
    // Clear mails
    E2EMails.resetSentMailsDb();

    // Add user
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EMeetingSeriesEditor.disableEmailForRoleChange();
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

    // open the dialog without saving roles and save
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

    //check emails
    const recipients = E2EMails.getAllRecipients();
    expect(recipients).to.have.length(0);
  });
});
