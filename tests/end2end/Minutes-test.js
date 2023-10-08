import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

describe("Minutes", () => {
  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  it("can add first minutes to meeting series", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #1";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(0);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.finalizeCurrentMinutes();
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
  });

  it("can add further minutes to meeting series", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #2";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    const countInitialMinutes = E2EMinutes.countMinutesForSeries(
      aProjectName,
      aMeetingName,
    );

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.finalizeCurrentMinutes();
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(countInitialMinutes + 2);
  });

  it("can add minutes for specific date", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #3";
    const myDate = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
    expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;
  });

  it("can delete unfinalized minutes", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #4";
    const myDate = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
    expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;

    // Now delete it!
    E2EMinutes.gotoMinutes(myDate);
    E2EGlobal.clickWithRetry("#btn_deleteMinutes");
    E2EApp.confirmationDialogAnswer(true);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(0);
    expect(E2EMinutes.getMinutesId(myDate)).not.to.be.ok;
  });

  it("can cancel delete of unfinalized minutes", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #5";
    const myDate = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
    expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;

    // Now trigger delete!
    E2EMinutes.gotoMinutes(myDate);
    E2EGlobal.clickWithRetry("#btn_deleteMinutes");
    E2EApp.confirmationDialogAnswer(false);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
    expect(E2EMinutes.getMinutesId(myDate)).to.be.ok;
  });

  it("displays an error message if the minute is not linked to the parent series", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #6";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    const urlArr = browser.getUrl().split("/");
    const msId = urlArr[urlArr.length - 1];

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    E2EGlobal.waitSomeTime(2000); // wait until parent check will be enabled

    const messageSelector = '[data-notify="container"]';

    expect(
      browser.isVisible(messageSelector),
      "flash message should not be visible before un-linking the minute",
    ).to.be.false;

    server.call("e2e.updateMeetingSeries", msId, { minutes: [] });

    browser.waitForVisible(messageSelector);
    const dialogMsgElement = browser.element(messageSelector).value.ELEMENT;
    const dialogMsgText = browser.elementIdText(dialogMsgElement).value;
    expect(dialogMsgText, "error message should be displayed").to.have.string(
      "Unfortunately the minute is not linked to its parent series correctly",
    );
  });

  it("can persist global notes", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #6";
    const aGlobalNote = "Amazing global note";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    browser.setValue('textarea[id="editGlobalNotes"]', aGlobalNote);
    E2EGlobal.clickWithRetry("#btnParticipantsExpand");

    let result = browser.getValue('textarea[id="editGlobalNotes"]');
    expect(result).to.equal(aGlobalNote);

    browser.refresh();
    E2EGlobal.waitSomeTime(2500); // phantom.js needs some time here...

    result = browser.getValue('textarea[id="editGlobalNotes"]');
    expect(result).to.equal(aGlobalNote);
  });

  it("hide closed topics", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #7";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    E2ETopics.addTopicToMinutes("topic #1");
    E2ETopics.addTopicToMinutes("topic #2");
    E2ETopics.addTopicToMinutes("topic #3");
    E2ETopics.addTopicToMinutes("topic #4");

    E2EGlobal.waitSomeTime(700);

    E2ETopics.toggleTopic(1);
    E2ETopics.toggleTopic(2);

    E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");

    expect(E2ETopics.countTopicsForMinute()).to.equal(2);
  });

  it("can navigate to previous and next minutes within a minutes", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name PrevNext";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.finalizeCurrentMinutes();
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.finalizeCurrentMinutes();
    const secondDate = E2EMinutes.getCurrentMinutesDate();
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    const thirdDate = E2EMinutes.getCurrentMinutesDate();

    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(3);

    E2EMinutes.gotoLatestMinutes();
    E2EGlobal.clickWithRetry("#btnPreviousMinutesNavigation");
    let currentdate = E2EMinutes.getCurrentMinutesDate();
    expect(currentdate).to.equal(secondDate);

    E2EGlobal.clickWithRetry("#btnNextMinutesNavigation");
    currentdate = E2EMinutes.getCurrentMinutesDate();
    expect(currentdate).to.equal(thirdDate);
  });

  it("hide closed topics by click", () => {
    const aProjectName = "E2E Minutes";
    const aMeetingName = "Meeting Name #8";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    E2ETopics.addTopicToMinutes("topic #1");
    E2ETopics.addTopicToMinutes("topic #2");
    E2ETopics.addTopicToMinutes("topic #3");
    E2ETopics.addTopicToMinutes("topic #4");

    E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");
    expect(E2ETopics.countTopicsForMinute()).to.equal(4);

    E2ETopics.toggleTopic(1);
    expect(E2ETopics.countTopicsForMinute()).to.equal(3);
  });
});
