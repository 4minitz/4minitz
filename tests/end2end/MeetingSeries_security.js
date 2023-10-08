import { E2EApp } from "./helpers/E2EApp";
import { E2ESecurity } from "./helpers/E2ESecurity";
import { E2EGlobal } from "./helpers/E2EGlobal";

const newName = "Changed Hacker Project #3";

describe("MeetingSeries Methods Security", () => {
  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  it("can not insert a new MeetingSerie if not logged in", () => {
    const name = "Insert a MeetingSerie";
    const meetingSeriesCount = server.call("e2e.countMeetingSeriesInMongDB");
    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2ESecurity.tryInsertMeetingSeries(
      name,
      meetingSeriesCount,
      "Meeting Series can not be added if user is not logged in",
    );

    E2EApp.loginUser();
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryInsertMeetingSeries(
      name,
      meetingSeriesCount + 1,
      "Meeting Series can be added if user is logged in",
    );
  });

  it("can not delete a new MeetingSerie if not logged in", () => {
    const name = "DeleteMeetingSerie";
    const ms_id = E2ESecurity.createMeetingSeries(name);
    const meetingSeriesCount = server.call("e2e.countMeetingSeriesInMongDB");
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 2);

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2ESecurity.tryDeleteMeetingSeries(
      ms_id,
      meetingSeriesCount,
      "Meeting Series can not be deleted if user is not logged in",
    );

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryDeleteMeetingSeries(
      ms_id,
      meetingSeriesCount,
      "Meeting Series can not be deleted if user is not invited to a MS",
    );

    E2EApp.loginUser(2);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryDeleteMeetingSeries(
      ms_id,
      meetingSeriesCount,
      "Meeting Series can not be deleted by invited user",
    );

    E2EApp.loginUser(0);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryDeleteMeetingSeries(
      ms_id,
      meetingSeriesCount - 1,
      "Meeting Series can be deleted if user is moderator",
    );
  });

  it("can not update a MeetingSerie if not logged in", () => {
    const name = "UpdateMeetingSerie";
    const ms_id = E2ESecurity.createMeetingSeries(name);
    const oldName = server.call("e2e.findMeetingSeries", ms_id).name;
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 2);

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateMeetingSeriesName(
      ms_id,
      newName,
      oldName,
      "Meeting Series can not be updated if user is not logged in",
    );

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateMeetingSeriesName(
      ms_id,
      newName,
      oldName,
      "Meeting Series can not be updated if user is not a moderator",
    );

    E2EApp.loginUser(2);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateMeetingSeriesName(
      ms_id,
      newName,
      oldName,
      "Meeting Series can not be updated by invited user",
    );

    E2EApp.loginUser();
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateMeetingSeriesName(
      ms_id,
      newName,
      newName,
      "Meeting Series can be updated if user is logged in and a moderator",
    );
  });
});

describe("MeetingSeries Publish & Subscribe Security", () => {
  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  before("reload page and reset app", () => {
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  it("Non-logged in users have no unexpected MS published", () => {
    const msUser1 = E2ESecurity.countRecordsInMiniMongo("meetingSeries");
    const name = "Publish MS Project #1";
    E2ESecurity.createMeetingSeries(name);

    expect(
      E2ESecurity.countRecordsInMiniMongo("meetingSeries"),
      "Moderator should have a MS published",
    ).to.equal(msUser1 + 1);

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    expect(
      E2ESecurity.countRecordsInMiniMongo("meetingSeries"),
      "Not logged in user should not have a MS published",
    ).to.equal(0);
    E2EApp.loginUser();
  });

  it("Invited users have no unexpected MS published", () => {
    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    const msUser2 = E2ESecurity.countRecordsInMiniMongo("meetingSeries");

    E2EApp.loginUser();
    const name = "Publish MS Project #2";
    const name2 = "Publish MS Project #22";
    E2ESecurity.createMeetingSeries(name);
    E2ESecurity.createMeetingSeries(name2);

    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    expect(
      E2ESecurity.countRecordsInMiniMongo("meetingSeries"),
      "Invited user should have a MS published",
    ).to.equal(msUser2 + 1);
    E2EApp.loginUser();
  });

  it("Informed users have no unexpected MS published", () => {
    E2EApp.loginUser(2);
    expect(E2EApp.isLoggedIn()).to.be.true;
    const msUser3 = E2ESecurity.countRecordsInMiniMongo("meetingSeries");

    E2EApp.loginUser();
    const name = "Publish MS Project #3";
    E2ESecurity.createMeetingSeries(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Informed", 2);

    E2EApp.loginUser(2);
    expect(E2EApp.isLoggedIn()).to.be.true;
    expect(
      E2ESecurity.countRecordsInMiniMongo("meetingSeries"),
      "Informed user should not have a MS published",
    ).to.equal(msUser3);
    E2EApp.loginUser();
  });
});
