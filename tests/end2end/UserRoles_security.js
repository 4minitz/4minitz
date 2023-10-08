import { E2EApp } from "./helpers/E2EApp";
import { E2ESecurity } from "./helpers/E2ESecurity";
import { E2EGlobal } from "./helpers/E2EGlobal";

const newRoleModerator = "01";

describe("UserRoles Method Security", () => {
  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  //userroles.saveRoleForMeetingSeries
  it("a user can not upgrade himself to a moderator of MS", () => {
    const name = "Update my own Role Project";
    const meetingSeriesID = E2ESecurity.createMeetingSeries(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);
    const oldRole = server.call("e2e.getUserRole", meetingSeriesID, 1);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateRole(meetingSeriesID, 1, newRoleModerator, oldRole);
    E2EApp.loginUser();
  });

  it("a moderator can change a role of an invited user in Meeting Series", () => {
    const name = "Update my own Role Moderator Project";
    const meetingSeriesID = E2ESecurity.createMeetingSeries(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);

    E2ESecurity.tryUpdateRole(
      meetingSeriesID,
      1,
      newRoleModerator,
      newRoleModerator,
    );
  });

  it("a user can not change a Role of another user in a Meeting Serie", () => {
    const name = "Update other users Role Project";
    const meetingSeriesID = E2ESecurity.createMeetingSeries(name);

    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);
    const oldRoleUser1 = server.call("e2e.getUserRole", meetingSeriesID, 1);

    E2EApp.loginUser(2);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateRole(
      meetingSeriesID,
      1,
      newRoleModerator,
      oldRoleUser1,
    );
    E2EApp.loginUser();
  });

  it("a user can not add himself to a Meeting Serie", () => {
    const name = "RoleUpdate add to MS Project";
    const meetingSeriesID = E2ESecurity.createMeetingSeries(name);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateRole(meetingSeriesID, 1, newRoleModerator, null);
    E2EApp.loginUser();
  });

  //userroles.removeAllRolesForMeetingSeries
  it("a Moderator can delete another user from a Meeting Serie", () => {
    const name = "RoleDelete Moderator Project";
    const meetingSeriesID = E2ESecurity.createMeetingSeries(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);

    E2ESecurity.tryRemoveRole(meetingSeriesID, 1, null);
  });

  it("a user can not delete another user from a Meeting Serie", () => {
    const name = "RoleDelete invited user Project";
    const meetingSeriesID = E2ESecurity.createMeetingSeries(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 2);
    const roleUser1 = server.call("e2e.getUserRole", meetingSeriesID, 1);

    E2EApp.loginUser(2);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryRemoveRole(meetingSeriesID, 1, roleUser1);
    E2EApp.loginUser();
  });
});

describe("Users Publish & Subscribe Security", () => {
  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  before("reload page and reset app", () => {
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  it("Non-logged in users have no users collection published", () => {
    expect(E2ESecurity.countRecordsInMiniMongo("users") > 0).to.be.true;

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    expect(
      E2ESecurity.countRecordsInMiniMongo("users"),
      "Not logged in user should not have users collection published",
    ).to.equal(0);
    E2EApp.loginUser();
  });
});
