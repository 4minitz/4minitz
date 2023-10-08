import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2EProtocols } from "./helpers/E2EProtocols";

describe("Protocols", () => {
  const _projectName = "E2E Protocols";
  const _meetingNameBase = "Meeting Name #";
  let _meetingCounter = 0;
  let _lastMinutesID;
  let _lastMeetingName;
  const getNewMeetingName = () => {
    _meetingCounter++;
    return _meetingNameBase + _meetingCounter;
  };

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;

    _lastMeetingName = getNewMeetingName();
    E2EMeetingSeries.createMeetingSeries(_projectName, _lastMeetingName);
    _lastMinutesID = E2EMinutes.addMinutesToMeetingSeries(
      _projectName,
      _lastMeetingName,
    );
  });

  // ******************
  // * DOCUMENT GENERATION TESTS
  // ******************

  it("No Protocol is created on finalizing Minutes if feature is disabled", () => {
    E2EProtocols.setSettingsForProtocolGeneration(); //Disable document generation

    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();
    E2EMinutes.finalizeCurrentMinutes();

    expect(
      browser.isExisting("#btn_unfinalizeMinutes"),
      "Minute has been finalized",
    ).to.be.true;

    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "No Protocol has been created",
    ).to.equal(numberOfProtocolsBefore);
  });

  it("HTML Protocol is created on finalizing Minutes", () => {
    E2EProtocols.setSettingsForProtocolGeneration("html");

    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();
    E2EMinutes.finalizeCurrentMinutes();

    expect(
      browser.isExisting("#btn_unfinalizeMinutes"),
      "Minute has been finalized",
    ).to.be.true;
    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "Protocol has been saved in database",
    ).to.equal(numberOfProtocolsBefore + 1);
    expect(
      E2EProtocols.checkProtocolFileForMinuteExits(_lastMinutesID),
      "Protocol has been saved on file system",
    ).to.be.true;
  });

  it("HTML Protocol is deleted on unfinalizing Minutes", () => {
    E2EProtocols.setSettingsForProtocolGeneration("html");

    E2EMinutes.finalizeCurrentMinutes();
    expect(
      browser.isExisting("#btn_unfinalizeMinutes"),
      "Minute has been finalized",
    ).to.be.true;

    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();
    expect(numberOfProtocolsBefore > 0, "A Protocol has been saved in database")
      .to.be.true;
    expect(
      E2EProtocols.checkProtocolFileForMinuteExits(_lastMinutesID),
      "A Protocol has been saved on file system",
    ).to.be.true;

    E2EMinutes.unfinalizeCurrentMinutes();

    E2EGlobal.waitSomeTime(5000);

    expect(
      browser.isExisting("#btn_unfinalizeMinutes"),
      "Minute has been unfinalized",
    ).to.be.false;
    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "The Protocol has been deleted in database",
    ).to.equal(numberOfProtocolsBefore - 1);
    expect(
      E2EProtocols.checkProtocolFileForMinuteExits(_lastMinutesID),
      "The Protocol has been deleted on file system",
    ).to.be.false;
  });

  // ******************
  // * DOWNLOAD TESTS
  // ******************

  it("Download Button is visible on finalized Minutes", () => {
    E2EProtocols.setSettingsForProtocolGeneration("html");

    expect(
      E2EProtocols.downloadButtonExists(),
      "Download button is not visible in unfinalized Mintues",
    ).to.be.false;
    E2EMinutes.finalizeCurrentMinutes();
    expect(
      E2EProtocols.downloadButtonExists(),
      "Download button is visible in finalized Mintues",
    ).to.be.true;
  });

  xit("Trying to download a non-existent protocol shows a confirmation dialog to download on-the-fly version", () => {
    E2EProtocols.setSettingsForProtocolGeneration(); //Deactivate protocol generation

    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();
    E2EMinutes.finalizeCurrentMinutes();
    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "No protocol has been created",
    ).to.equal(numberOfProtocolsBefore);

    E2EProtocols.setSettingsForProtocolGeneration("html"); //Reactivate protocol generation, otherwise there won't be a download-button
    E2EApp.logoutUser(); //Re-Login to allow app to get changes of settings
    E2EApp.loginUser();
    E2EMeetingSeries.gotoMeetingSeries(_projectName, _lastMeetingName);
    E2EMinutes.gotoLatestMinutes();

    expect(
      E2EProtocols.checkDownloadOpensConfirmationDialog(),
      "Confirmation Dialog is opened",
    ).to.be.true;
  });

  it("Trying to download an existant protocol shows no confirmation dialog", () => {
    console.log("checkpoint-1");
    E2EProtocols.setSettingsForProtocolGeneration("html");
    console.log("checkpoint-2");
    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();
    console.log("checkpoint-3");

    E2EMinutes.finalizeCurrentMinutes();
    console.log("checkpoint-4");
    browser.scroll(".navbar-header"); //without this the "Minutes finalized" toast would be right above the download button
    console.log("checkpoint-5");
    E2EGlobal.waitSomeTime(750);
    console.log("checkpoint-6");
    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "Protocol has been saved in database",
    ).to.equal(numberOfProtocolsBefore + 1);
    console.log("checkpoint-7");
    expect(
      E2EProtocols.checkDownloadOpensConfirmationDialog(),
      "No Confirmation Dialog is opened",
    ).to.be.false;
    console.log("checkpoint-8");
  });

  it("Trying to download an protocol with an direct link should work with proper permissions", () => {
    E2EProtocols.setSettingsForProtocolGeneration("html");
    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();

    E2EMinutes.finalizeCurrentMinutes();
    E2EGlobal.waitSomeTime(750);
    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "Protocol has been saved in database",
    ).to.equal(numberOfProtocolsBefore + 1);

    browser.execute(
      (link) => {
        window.location = link;
      },
      E2EProtocols.getDownloadLinkForProtocolOfMinute(_lastMinutesID) +
        "?download=true",
    );

    E2EGlobal.waitSomeTime(750);

    expect(browser.getText("body")).to.not.have.string("File Not Found");
  });

  it("Trying to download an protocol with an direct link should not work when logged out", () => {
    E2EProtocols.setSettingsForProtocolGeneration("html");
    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();

    E2EMinutes.finalizeCurrentMinutes();
    E2EGlobal.waitSomeTime(750);
    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "Protocol has been saved in database",
    ).to.equal(numberOfProtocolsBefore + 1);

    E2EApp.logoutUser();
    browser.execute(
      (link) => {
        window.location = link;
      },
      E2EProtocols.getDownloadLinkForProtocolOfMinute(_lastMinutesID) +
        "?download=true",
    );

    E2EGlobal.waitSomeTime(750);

    expect(browser.getText("body")).to.have.string("File Not Found");
  });

  it("Trying to download an protocol with an direct link should not work when loggin in but no permissions", () => {
    E2EProtocols.setSettingsForProtocolGeneration("html");
    const numberOfProtocolsBefore = E2EProtocols.countProtocolsInMongoDB();

    E2EMinutes.finalizeCurrentMinutes();
    E2EGlobal.waitSomeTime(750);
    expect(
      E2EProtocols.countProtocolsInMongoDB(),
      "Protocol has been saved in database",
    ).to.equal(numberOfProtocolsBefore + 1);

    E2EApp.logoutUser();
    E2EApp.loginUser(1);
    browser.execute(
      (link) => {
        window.location = link;
      },
      E2EProtocols.getDownloadLinkForProtocolOfMinute(_lastMinutesID) +
        "?download=true",
    );

    E2EGlobal.waitSomeTime(750);

    expect(browser.getText("body")).to.have.string("File Not Found");
  });
});
