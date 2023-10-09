import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

describe("Topics Responsibles", () => {
  const aProjectName = "E2E Topics Responsibles";
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

  it("can add a responsible to a topic", () => {
    const user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
    E2ETopics.addTopicToMinutes("TOP-1", user1);

    const topicHeadingText = browser
      .element("#topicPanel .well:nth-child(1) h3")
      .getText();
    expect(topicHeadingText).to.contain(user1);
  });

  it("can add two responsibles to a topic", () => {
    const user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2ETopics.addTopicToMinutes("TOP-1", `${user1},${user2}`);

    const topicHeadingText = browser
      .element("#topicPanel .well:nth-child(1) h3")
      .getText();
    expect(topicHeadingText).to.contain(user1);
    expect(topicHeadingText).to.contain(user2);
  });

  it("can remove a responsible from a topic", () => {
    const user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2ETopics.addTopicToMinutes("TOP-1", `${user1},${user2}`);

    E2ETopics.openEditTopicForMinutes(1);
    browser
      .element(".form-group-responsibles .select2-selection__choice__remove")
      .click(); // remove first user
    browser.element(".form-group-responsibles .select2-selection").click();
    E2EGlobal.clickWithRetry("#btnTopicSave");
    E2EGlobal.waitSomeTime();

    const topicHeadingText = browser
      .element("#topicPanel .well:nth-child(1) h3")
      .getText();
    expect(topicHeadingText).to.contain(user2);
  });

  it("can add arbitrary free text responsible name", () => {
    const username = "Max Mustermann";
    E2ETopics.addTopicToMinutes("TOP-1", username);
    const topicHeadingText = browser
      .element("#topicPanel .well:nth-child(1) h3")
      .getText();
    expect(topicHeadingText).to.contain(username);
  });

  it("can add a responsible from the participant users", () => {
    const user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
    E2ETopics.addTopicToMinutes("TOP-1", "");

    E2ETopics.openEditTopicForMinutes(1);
    browser.element(".form-group-responsibles .select2-selection").click();
    E2EGlobal.waitSomeTime();
    E2EGlobal.sendKeysWithPause("1", 200, "\uE015\uE007");
    E2EGlobal.clickWithRetry("#btnTopicSave");
    E2EGlobal.waitSomeTime(500);

    const topicHeadingText = browser
      .element("#topicPanel .well:nth-child(1) h3")
      .getText();
    expect(topicHeadingText).to.contain(user1);
  });

  it("can add a responsible from user collection that is not a participant", () => {
    const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
    E2ETopics.addTopicToMinutes("TOP-1", "");

    E2ETopics.openEditTopicForMinutes(1);
    E2EGlobal.waitSomeTime();
    browser.element(".form-group-responsibles .select2-selection").click();
    E2EGlobal.sendKeysWithPause("3", 200, "\uE015\uE007"); // "3" (end of user3 string) + CursorDown + Enter
    E2EGlobal.clickWithRetry("#btnTopicSave");
    E2EGlobal.waitSomeTime(500);

    const topicHeadingText = browser
      .element("#topicPanel .well:nth-child(1) h3")
      .getText();
    expect(topicHeadingText).to.contain(user3);
  });

  it("can add a responsible from drop-down that is an additional participant", () => {
    const additionalParticipant = "Additional Participant";
    browser.setValue("#edtParticipantsAdditional", additionalParticipant);

    E2ETopics.addTopicToMinutes("TOP-1", "");

    E2ETopics.openEditTopicForMinutes(1);
    E2EGlobal.waitSomeTime();

    browser.element(".form-group-responsibles .select2-selection").click();
    // We only send the beginning of the name, to ensure the drop-down is used for selection!
    E2EGlobal.sendKeysWithPause("Addi", 300, "\uE015\uE007"); // + CursorDown + Enter

    E2EGlobal.clickWithRetry("#btnTopicSave");
    E2EGlobal.waitSomeTime();

    const topicHeadingText = browser
      .element("#topicPanel .well:nth-child(1) h3")
      .getText();
    expect(topicHeadingText).to.contain(additionalParticipant);
  });
});
