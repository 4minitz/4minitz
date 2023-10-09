require("./helpers/Server");
require("./helpers/wdio_v4_to_v5");

import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMeetingSeriesEditor } from "./helpers/E2EMeetingSeriesEditor";
import { E2EMinutes } from "./helpers/E2EMinutes";

describe("MeetingSeries Editor", () => {
  const aProjectName = "E2E MeetingSeries Editor";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;

  before("reload page and reset app", () => {
    console.log("Executing: ", E2EGlobal.getTestSpecFilename());
    server.connect();
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp();
    E2EApp.launchApp();
  });

  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;

    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
  });

  it("can open and close meeting series editor without changing data", () => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    // Now dialog should be there
    expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.true;
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false); // close with cancel
    // Now dialog should be gone
    expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.false;
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not
      .to.be.false;
  });

  it("can open and cancel meeting series editor without changing data", () => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    // Now dialog should be there
    expect(browser.isVisible("#btnMeetinSeriesEditCancel")).to.be.true;
    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel");
    E2EGlobal.waitSomeTime(); // give dialog animation time
    // Now dialog should be gone
    expect(browser.isVisible("#btnMeetinSeriesEditCancel")).to.be.false;
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not
      .to.be.false;
  });

  it("can delete an empty meeting series", () => {
    const countAfterCreate = E2EMeetingSeries.countMeetingSeries();
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to
      .be.ok;
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

    E2EGlobal.clickWithRetry("#deleteMeetingSeries");
    E2EApp.confirmationDialogAnswer(true);

    expect(E2EMeetingSeries.countMeetingSeries()).to.equal(
      countAfterCreate - 1,
    );
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not
      .to.be.ok;
  });

  it("can cancel delete of meeting series", () => {
    const countAfterCreate = E2EMeetingSeries.countMeetingSeries();
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to
      .be.ok;
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

    E2EGlobal.clickWithRetry("#deleteMeetingSeries");
    E2EApp.confirmationDialogAnswer(false);

    expect(E2EMeetingSeries.countMeetingSeries()).to.equal(countAfterCreate);
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to
      .be.ok;
  });

  it("can clean up child minutes on deleting meeting series", () => {
    const aMeetingName = "Meeting Name (with Minute)";

    const countDBMeetingSeriesBefore = server.call(
      "e2e.countMeetingSeriesInMongDB",
    );
    const countDBMinutesBefore = server.call("e2e.countMinutesInMongoDB");
    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.finalizeCurrentMinutes();
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

    // One more Meeting series and one more minutes
    expect(server.call("e2e.countMeetingSeriesInMongDB")).to.equal(
      countDBMeetingSeriesBefore + 1,
    );
    expect(server.call("e2e.countMinutesInMongoDB")).to.equal(
      countDBMinutesBefore + 1,
    );

    // Now delete meeting series with attached Minutes
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    E2EGlobal.clickWithRetry("#deleteMeetingSeries");
    E2EApp.confirmationDialogAnswer(true);

    // Meeting series and attached minutes should be gone
    expect(server.call("e2e.countMeetingSeriesInMongDB")).to.equal(
      countDBMeetingSeriesBefore,
    );
    expect(server.call("e2e.countMinutesInMongoDB")).to.equal(
      countDBMinutesBefore,
    );
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not
      .to.be.ok;
  });

  it("can not save meeting series without project or name", () => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    browser.setValue('input[id="id_meetingproject"]', ""); // empty input
    browser.setValue('input[id="id_meetingname"]', ""); // empty input
    E2EGlobal.clickWithRetry("#btnMeetingSeriesSave"); // try to save
    expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.true; // dialog still open!

    browser.setValue('input[id="id_meetingproject"]', "XXX");
    browser.setValue('input[id="id_meetingname"]', ""); // empty input
    E2EGlobal.clickWithRetry("#btnMeetingSeriesSave"); // try to save
    expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.true; // dialog still open!

    browser.setValue('input[id="id_meetingproject"]', ""); // empty input
    browser.setValue('input[id="id_meetingname"]', "XXX");
    E2EGlobal.clickWithRetry("#btnMeetingSeriesSave"); // try to save
    expect(browser.isVisible("#btnMeetingSeriesSave")).to.be.true; // dialog still open!

    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false); // close with cancel
    E2EApp.gotoStartPage();
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to
      .be.ok; // prj/name should be unchanged
  });

  it("can save meeting series with new project name and meeting name", () => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    const aNewProjectName = "E2E New Project";
    const aNewMeetingName = "New Meeting Name";
    browser.setValue('input[id="id_meetingproject"]', aNewProjectName);
    browser.setValue('input[id="id_meetingname"]', aNewMeetingName);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.gotoStartPage();
    expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not
      .to.be.ok;
    expect(
      E2EMeetingSeries.getMeetingSeriesId(aNewProjectName, aNewMeetingName),
    ).to.be.ok;
  });

  it("can restore fields after close and re-open", () => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    browser.setValue(
      'input[id="id_meetingproject"]',
      `${aProjectName} Changed!`,
    );
    browser.setValue('input[id="id_meetingname"]', `${aMeetingName} Changed!`);

    E2EGlobal.clickWithRetry("#btnEditMSClose"); // Don't store new values!
    E2EGlobal.waitSomeTime(); // give dialog animation time

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "base",
      true,
    );
    expect(browser.getValue('input[id="id_meetingproject"]')).to.equal(
      aProjectName,
    );
    expect(browser.getValue('input[id="id_meetingname"]')).to.equal(
      aMeetingName,
    );

    E2EGlobal.clickWithRetry("#btnEditMSClose");
    E2EGlobal.waitSomeTime(); // give dialog animation time
  });

  it("can restore fields after cancel and re-open", () => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    browser.setValue(
      'input[id="id_meetingproject"]',
      `${aProjectName} Changed!`,
    );
    browser.setValue('input[id="id_meetingname"]', `${aMeetingName} Changed!`);

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel");
    E2EGlobal.waitSomeTime(); // give dialog animation time

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "base",
      true,
    );
    expect(browser.getValue('input[id="id_meetingproject"]')).to.equal(
      aProjectName,
    );
    expect(browser.getValue('input[id="id_meetingname"]')).to.equal(
      aMeetingName,
    );

    E2EGlobal.clickWithRetry("#btnMeetinSeriesEditCancel");
    E2EGlobal.waitSomeTime(); // give dialog animation time
  });

  it("can delete a meeting series", () => {
    const initialCount = E2EMeetingSeries.countMeetingSeries();

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
    E2EGlobal.clickWithRetry("#deleteMeetingSeries");
    E2EGlobal.waitSomeTime(); // give dialog animation time
    E2EApp.confirmationDialogAnswer(true);

    expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount - 1);
  });
});
