import { E2EApp } from "./helpers/E2EApp";
import { E2ESecurity } from "./helpers/E2ESecurity";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EGlobal } from "./helpers/E2EGlobal";

const newMinuteDate = "01.01.2000";

describe("Minutes Method Security", () => {
  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });
  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  //minute.update
  it("can update a Minute if moderator", () => {
    const name = "MinuteUpdate as moderator";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    E2ESecurity.tryUpdateCurrentMinuteDate(
      min.min_id,
      newMinuteDate,
      newMinuteDate,
    );
  });

  it("can not update a Minute if not logged in", () => {
    const name = "MinuteUpdate as not logged in";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    E2EApp.logoutUser();

    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2ESecurity.tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
    E2EApp.loginUser();
  });

  it("can not update a Minute if not invited to a Meeting Serie", () => {
    const name = "MinuteUpdate as not invited to MS";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;

    E2ESecurity.tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
    E2EApp.loginUser();
  });

  it("can not update a Minute as an invited user", () => {
    const name = "MinuteUpdate as Invited";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;

    E2ESecurity.tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
    E2EApp.loginUser();
  });

  //addMinute
  it("can not add a new Minute if not logged in", () => {
    const name = "MinuteAdd as not logged in";
    const ms_id = E2ESecurity.createMeetingSeries(name);

    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2ESecurity.tryAddNewMinute(ms_id, "29.07.2017", numberOfMinutes, 0);
    E2EApp.loginUser();
  });

  it("can add a new Minute if a moderator", () => {
    const name = "MinuteAdd as moderator";
    const ms_id = E2ESecurity.createMeetingSeries(name);
    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");

    E2ESecurity.tryAddNewMinute(ms_id, "29.07.2017", numberOfMinutes + 1, 0);
  });

  it("can not add a new Minute as an invited user", () => {
    const name = "MinuteAdd as invited user";
    const ms_id = E2ESecurity.createMeetingSeries(name);
    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryAddNewMinute(ms_id, "29.07.2017", numberOfMinutes, 1);
    E2EApp.loginUser();
  });

  it("can not add a new Minute if not invited to a Meeting Serie", () => {
    const name = "MinuteAdd as not invited to MS";
    const ms_id = E2ESecurity.createMeetingSeries(name);
    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryAddNewMinute(ms_id, "29.07.2017", numberOfMinutes, 1);
    E2EApp.loginUser();
  });

  //workflow.removeMinute
  it("can delete a Minute if a moderator", () => {
    const name = "MinuteDelete as moderator";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");

    E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes - 1);
  });

  it("can not delete a Minute if not logged in", () => {
    const name = "MinuteDelete as not logged in";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");

    E2EApp.logoutUser();
    E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes);
    E2EApp.loginUser();
  });

  it("can not delete a Minute if not invited to a Meeting Serie", () => {
    const name = "MinuteDelete as not invited to MS";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes);
    E2EApp.loginUser();
  });

  it("can not delete a Minute as an invited user", () => {
    const name = "MinuteDelete as an invited user";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    const numberOfMinutes = server.call("e2e.countMinutesInMongoDB");
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes);
    E2EApp.loginUser();
  });

  //workflow.finalizeMinute
  it("can finalize a Minute if Moderator", () => {
    const name = "MinuteFinalize as moderator";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2ESecurity.tryFinalizeMinute(min.min_id, true);
  });

  it("can not finalize a Minute if not logged in", () => {
    const name = "MinuteFinalize as not logged in";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2ESecurity.tryFinalizeMinute(min.min_id, false);
    E2EApp.loginUser();
  });

  it("can not finalize a Minute if not invited to a Meeting Serie", () => {
    const name = "MinuteFinalize as not invited to MS";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryFinalizeMinute(min.min_id, false);
    E2EApp.loginUser();
  });

  it("can not finalize a Minute as an invited user", () => {
    const name = "MinuteFinalize as an invited user";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryFinalizeMinute(min.min_id, false);
    E2EApp.loginUser();
  });

  //workflow.unfinalizeMinute
  it("can unfinalize a Minute if Moderator", () => {
    const name = "MinuteUnfinalize as moderator";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
    E2ESecurity.tryUnfinalizeMinute(min.min_id, false);
  });

  it("can not unfinalize a Minute if not logged in", () => {
    const name = "MinuteUnfinalize as not logged in";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    E2ESecurity.tryUnfinalizeMinute(min.min_id, true);
    E2EApp.loginUser();
  });

  it("can not unfinalize a Minute if not invited to a Meeting Serie", () => {
    const name = "MinuteUnfinalize as not invited to MS";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUnfinalizeMinute(min.min_id, true);
    E2EApp.loginUser();
  });

  it("can not unfinalize a Minute as an invited user", () => {
    const name = "MinuteUnfinalize as an invited user";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);
    E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    E2ESecurity.tryUnfinalizeMinute(min.min_id, true);
    E2EApp.loginUser();
  });

  it("can not unfinalize a Minute as a Moderator if it is not the last one", () => {
    const name = "MinuteUnfinalize for not last Minute";
    const minute_1 = E2ESecurity.createMeetingSeriesAndMinute(name);

    E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, minute_1.min_id);
    E2EMinutes.addMinutesToMeetingSeries(name, name);
    E2EMinutes.gotoLatestMinutes();
    const minuteID_2 = E2EMinutes.getCurrentMinutesId();
    E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, minuteID_2);

    E2ESecurity.tryUnfinalizeMinute(minute_1.min_id, true);
  });
});

describe("Minute Publish & Subscribe Security", () => {
  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  before("reload page and reset app", () => {
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  it("Non-logged in users have no unexpected Minutes published", () => {
    const name = "Publish Minutes Project #1";
    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    E2ESecurity.tryFinalizeMinute(min.min_id, true);

    E2EMinutes.addMinutesToMeetingSeries(name, name);

    expect(
      E2ESecurity.countRecordsInMiniMongo("minutes"),
      "Moderator should have 2 Minutes published",
    ).to.equal(2);

    E2EApp.logoutUser();
    expect(E2EApp.isNotLoggedIn()).to.be.true;
    expect(
      E2ESecurity.countRecordsInMiniMongo("minutes"),
      "Not logged in user should not have Minutes published",
    ).to.equal(0);

    E2EApp.loginUser();
  });

  it("Invited users should have Minutes published", () => {
    expect(E2EApp.isLoggedIn()).to.be.true;
    const name = "Publish Minutes Project #2";

    const min = E2ESecurity.createMeetingSeriesAndMinute(name);
    E2ESecurity.inviteUserToMeetingSerie(name, "Invited", 1);
    E2ESecurity.tryFinalizeMinute(min.min_id, true);

    E2EMinutes.addMinutesToMeetingSeries(name, name);
    expect(
      E2ESecurity.countRecordsInMiniMongo("minutes"),
      "Moderator should have 2 Minutes published",
    ).to.equal(2);

    E2EApp.loginUser(1);
    expect(E2EApp.isLoggedIn()).to.be.true;
    expect(
      E2ESecurity.countRecordsInMiniMongo("minutes"),
      "Invited user should have no Minutes published when not within a Meeting Series",
    ).to.equal(0);
    E2EMeetingSeries.gotoMeetingSeries(name, name);
    E2EGlobal.waitSomeTime();
    expect(
      E2ESecurity.countRecordsInMiniMongo("minutes"),
      "Invited user should have 2 Minutes published",
    ).to.equal(2);

    E2EApp.loginUser();
  });
});
