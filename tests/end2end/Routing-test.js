import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";

describe("Routing", () => {
  const aProjectName = "E2E Topics";
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
  });

  after("clear database and login user", () => {
    E2EApp.launchApp();
    E2EApp.loginUser();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  it("ensures that following a URL to a meeting series will relocate to the requested series after sign-in", () => {
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    const url = browser.getUrl();

    E2EApp.logoutUser();

    browser.url(url);

    E2EApp.loginUser(0, false);

    const selector = "h2.header";
    const header = browser.element(selector).value.ELEMENT;
    const headerText = browser.elementIdText(header).value;
    expect(headerText).to.have.string(`Meeting Series: ${aProjectName}`);
  });

  it("ensures that following a URL to a concrete minute will relocate to the requested minute after sign-in", () => {
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    const url = browser.getUrl();

    E2EApp.logoutUser();

    browser.url(url);

    E2EApp.loginUser(0, false);

    const selector = "h2.header";
    const header = browser.element(selector).value.ELEMENT;
    const headerText = browser.elementIdText(header).value;
    expect(headerText).to.have.string(`Minutes for ${aProjectName}`);
  });

  it('ensures that "legal notice" route shows expected text', () => {
    expect(
      browser.isVisible("div#divLegalNotice"),
      "legal notice should be invisible",
    ).to.be.false;
    browser.keys(["Escape"]); // close eventually open modal dialog
    E2EGlobal.waitSomeTime();

    // Force to switch route
    browser.url(`${E2EGlobal.SETTINGS.e2eUrl}/legalnotice`);
    expect(browser.getUrl(), "on 'legal notice' route").to.contain(
      "/legalnotice",
    );
    expect(
      browser.isVisible("div#divLegalNotice"),
      "legal notice should be visible",
    ).to.be.true;
    expect(
      browser.getText("div#divLegalNotice"),
      "check text in legal notice route",
    ).to.contain("THE DEMO SERVICE AVAILABLE VIA");
  });

  it('ensures that "legal notice" route is reachable on login screen via About dialog', () => {
    E2EGlobal.waitSomeTime(1500);
    browser.keys(["Escape"]); // close open edit meeting series dialog
    E2EGlobal.waitSomeTime();
    E2EApp.logoutUser();

    // open about dialog and trigger legal notice link
    expect(browser.getUrl(), "on normal route").not.to.contain("/legalnotice");
    E2EGlobal.clickWithRetry("#btnAbout");
    E2EGlobal.waitSomeTime();
    E2EGlobal.clickWithRetry("#btnLegalNotice");
    expect(browser.getUrl(), "on 'legal notice' route").to.contain(
      "/legalnotice",
    );
  });
});
