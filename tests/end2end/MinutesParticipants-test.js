import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMeetingSeriesEditor } from "./helpers/E2EMeetingSeriesEditor";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2EMinutesParticipants } from "./helpers/E2EMinutesParticipants";

describe("Minutes Participants", () => {
  const aProjectName = "E2E Minutes Participants";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;

    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
  });

  it("ensures per default only creator of series is participant", () => {
    const participantsInfo = new E2EMinutesParticipants();
    expect(participantsInfo.getParticipantsCount()).to.equal(1);
    expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser())).to.be
      .ok;
  });

  it("can add users to series which will show up on new minutes", () => {
    E2EMinutes.finalizeCurrentMinutes(); // we don't need these...

    // prepare meeting series
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user3,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    // now create some new minutes
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    const participantsInfo = new E2EMinutesParticipants();
    expect(participantsInfo.getParticipantsCount()).to.equal(3);
    expect(
      participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()),
      "currentUser",
    ).to.be.ok;
    expect(participantsInfo.getParticipantInfo(user2), user2).to.be.ok;
    expect(participantsInfo.getParticipantInfo(user3), user3).to.be.ok;
  });

  it("can add users to series which will show up on unfinalized minutes", () => {
    // prepare meeting series
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user3,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EMinutes.gotoLatestMinutes();

    browser.waitForVisible("#btnParticipantsExpand", 3000);

    const participantsInfo = new E2EMinutesParticipants();
    expect(participantsInfo.getParticipantsCount()).to.equal(3);
    expect(
      participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()),
      "currentUser",
    ).to.be.ok;
    expect(participantsInfo.getParticipantInfo(user2), user2).to.be.ok;
    expect(participantsInfo.getParticipantInfo(user3), user3).to.be.ok;
  });

  it("prohibits user changes in series to propagate to all finalized minutes", () => {
    E2EMinutes.finalizeCurrentMinutes();

    // prepare meeting series
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user3,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EMinutes.gotoLatestMinutes();
    // finalized minutes have their participants collapsed, by default.
    E2EMinutesParticipants.expand();

    const participantsInfo = new E2EMinutesParticipants();
    expect(participantsInfo.getParticipantsCount()).to.equal(1);
    expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser())).to.be
      .ok;
  });

  it("can persist checked participants", () => {
    // prepare meeting series
    const currentUser = E2EApp.getCurrentUser();
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user3,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EMinutes.gotoLatestMinutes();
    const minId = E2EMinutes.getCurrentMinutesId();

    const participantsInfo = new E2EMinutesParticipants();
    participantsInfo.setUserPresence(currentUser, true);
    participantsInfo.setUserPresence(user3, true);

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    const parts =
      E2EMinutesParticipants.getPresentParticipantsFromServer(minId);
    expect(parts).to.contain(currentUser);
    expect(parts).to.contain(user3);
  });

  it("can persist additional participants", () => {
    const additionalUser = "Max Mustermann";
    browser.setValue("#edtParticipantsAdditional", additionalUser);
    E2EMinutes.finalizeCurrentMinutes();

    const minId = E2EMinutes.getCurrentMinutesId();
    const parts =
      E2EMinutesParticipants.getPresentParticipantsFromServer(minId);
    expect(parts).to.contains(additionalUser);
  });

  it("can show collapsed view", () => {
    E2EMinutesParticipants.collapse();
    expect(E2EMinutesParticipants.isCollapsed()).to.be.true;
  });

  it("can re-expand a collapsed view", () => {
    E2EMinutesParticipants.collapse();
    E2EMinutesParticipants.expand();
    expect(E2EMinutesParticipants.isExpanded()).to.be.true;
  });

  it("shows collapsed view for non-moderators", () => {
    // prepare meeting series
    const currentUser = E2EApp.getCurrentUser();
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    E2EMinutes.gotoLatestMinutes();

    expect(E2EMinutesParticipants.isCollapsed()).to.be.true;

    E2EApp.loginUser();
  });

  it("prohibits non-moderator users to change participants", () => {
    // prepare meeting series
    const currentUser = E2EApp.getCurrentUser();
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.gotoLatestMinutes();
    E2EMinutesParticipants.expand();

    const participantsInfoBefore = new E2EMinutesParticipants();
    participantsInfoBefore.setUserPresence(currentUser, true);
    participantsInfoBefore.setUserPresence(user2, true);
    const additionalUser = "Max Mustermann";
    try {
      browser.setValue("#edtParticipantsAdditional", additionalUser);
    } catch (e) {}

    const participantsInfoAfter = new E2EMinutesParticipants();
    expect(participantsInfoAfter).to.deep.equal(participantsInfoBefore);

    E2EApp.loginUser();
  });

  it("prohibits change of participants on finalized minutes", () => {
    E2EMinutes.finalizeCurrentMinutes();
    const currentUser = E2EApp.getCurrentUser();
    const participantsInfoBefore = new E2EMinutesParticipants();
    participantsInfoBefore.setUserPresence(currentUser, true);
    const additionalUser = "Max Mustermann";
    try {
      browser.setValue("#edtParticipantsAdditional", additionalUser);
    } catch (e) {}

    const participantsInfoAfter = new E2EMinutesParticipants();
    expect(participantsInfoAfter).to.deep.equal(participantsInfoBefore);
  });

  it("collapses / expands participants on finalize / un-finalize", () => {
    expect(E2EMinutesParticipants.isExpanded(), "initial state").to.be.true;
    E2EMinutes.finalizeCurrentMinutes();
    expect(E2EMinutesParticipants.isCollapsed(), "after finalize").to.be.true;
    E2EMinutes.unfinalizeCurrentMinutes();
    expect(E2EMinutesParticipants.isExpanded(), "after unfinalize").to.be.true;
  });

  it("shows participants on minutelist in meeting series details view", () => {
    // prepare meeting series
    const currentUser = E2EApp.getCurrentUser();
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.addUserToMeetingSeries(
      user3,
      E2EGlobal.USERROLES.Moderator,
    );
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EMinutes.gotoLatestMinutes();
    const participantsInfo = new E2EMinutesParticipants();
    participantsInfo.setUserPresence(currentUser, true);
    participantsInfo.setUserPresence(user3, true);
    const additionalUser = "Max Mustermann";
    browser.setValue("#edtParticipantsAdditional", additionalUser);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(browser.getText("tr#id_MinuteRow")).to.contain(
      "user1; user3; Max Mustermann",
    );
  });

  it("can edit participants from within a minute as a moderator", () => {
    let participantsInfo = new E2EMinutesParticipants();
    expect(participantsInfo.getParticipantsCount()).to.equal(1);

    E2EGlobal.clickWithRetry("#btnEditParticipants");
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    participantsInfo = new E2EMinutesParticipants();
    expect(participantsInfo.getParticipantsCount()).to.equal(2);
  });
});
