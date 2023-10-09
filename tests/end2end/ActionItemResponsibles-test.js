import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMeetingSeriesEditor } from "./helpers/E2EMeetingSeriesEditor";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

require("../../imports/helpers/date");

describe("ActionItems Responsibles", () => {
  const aProjectName = "E2E ActionItems Responsibles";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;
  let aTopicCounter = 0;
  const aTopicNameBase = "Topic Name #";
  let aTopicName;
  let aAICounter = 0;
  const aAINameBase = "Action Item Name #";

  const getNewMeetingName = () => {
    aMeetingCounter++;
    return aMeetingNameBase + aMeetingCounter;
  };
  const getNewTopicName = () => {
    aTopicCounter++;
    return aTopicNameBase + aTopicCounter;
  };
  const getNewAIName = () => {
    aAICounter++;
    return aAINameBase + aAICounter;
  };

  function addActionItemToFirstTopic() {
    const actionItemName = getNewAIName();

    E2ETopics.addInfoItemToTopic(
      {
        subject: actionItemName,
        itemType: "actionItem",
      },
      1,
    );

    return actionItemName;
  }

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach(
    "make sure test user is logged in, create series and add minutes",
    () => {
      E2EApp.gotoStartPage();
      expect(E2EApp.isLoggedIn()).to.be.true;

      aMeetingName = getNewMeetingName();

      E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      aTopicName = getNewTopicName();
      E2ETopics.addTopicToMinutes(aTopicName);
    },
  );

  it("can add an action item with a responsible", () => {
    const topicIndex = 1;
    const user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];

    E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

    const actionItemName = getNewAIName();
    E2ETopics.insertInfoItemDataIntoDialog({
      subject: actionItemName,
      itemType: "actionItem",
      responsible: user1,
    });
    browser.element("#btnInfoItemSave").click();
    E2EGlobal.waitSomeTime();

    const selector = `#topicPanel .well:nth-child(${topicIndex}) #headingOne`;
    const actionItemExpandElement = browser.element(selector).value.ELEMENT;
    const actionItemExpandElementText = browser.elementIdText(
      actionItemExpandElement,
    ).value;

    expect(
      actionItemExpandElementText,
      "user1 shall be responsible",
    ).to.have.string(user1);
  });

  it("can add an action item with two responsibles", () => {
    const topicIndex = 1;
    const user1 = E2EGlobal.SETTINGS.e2eTestUsers[0];
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];

    E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

    const actionItemName = getNewAIName();
    E2ETopics.insertInfoItemDataIntoDialog({
      subject: actionItemName,
      itemType: "actionItem",
      responsible: `${user1},${user2}`,
    });
    browser.element("#btnInfoItemSave").click();
    E2EGlobal.waitSomeTime();

    const selector = `#topicPanel .well:nth-child(${topicIndex}) #headingOne`;
    const actionItemExpandElement = browser.element(selector).value.ELEMENT;
    const actionItemExpandElementText = browser.elementIdText(
      actionItemExpandElement,
    ).value;

    expect(
      actionItemExpandElementText,
      "user1 shall be responsible",
    ).to.have.string(user1);
    expect(
      actionItemExpandElementText,
      "user2 shall be responsible",
    ).to.have.string(user2);
  });

  it("can add an action item with a free-text EMail-responsible", () => {
    const topicIndex = 1;
    const emailUser = "noreply@4minitz.com";
    E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

    const actionItemName = getNewAIName();
    E2ETopics.insertInfoItemDataIntoDialog({
      subject: actionItemName,
      itemType: "actionItem",
      responsible: emailUser,
    });
    browser.element("#btnInfoItemSave").click();
    E2EGlobal.waitSomeTime();

    const selector = `#topicPanel .well:nth-child(${topicIndex}) #headingOne`;
    const actionItemExpandElement = browser.element(selector).value.ELEMENT;
    const actionItemExpandElementText = browser.elementIdText(
      actionItemExpandElement,
    ).value;

    expect(
      actionItemExpandElementText,
      "user1 shall be responsible",
    ).to.have.string(emailUser);
    E2EGlobal.waitSomeTime();
  });

  it("prohibits non-email-string as free-text responsible", () => {
    const topicIndex = 1;
    const illegalUserName = "NonEMailResponsible";
    E2ETopics.openInfoItemDialog(topicIndex, "actionItem");

    const actionItemName = getNewAIName();
    E2ETopics.insertInfoItemDataIntoDialog({
      subject: actionItemName,
      itemType: "actionItem",
      responsible: illegalUserName,
    });

    // check if 'Invalid Responsible' modal info dialog shows up
    // Hint: browser.getText("h4.modal-title") delivers an array
    // where we are only interested in the *last* element - thus we pop()
    E2EGlobal.waitSomeTime();
    expect(
      browser.getText("h4.modal-title").pop(),
      "'Invalid Responsible' modal should be visible",
    ).to.have.string("Invalid Responsible");

    E2EApp.confirmationDialogAnswer(true); // click info modal "OK"
    E2EGlobal.waitSomeTime();

    browser.element("#btnInfoItemSave").click(); // save AI
    E2EGlobal.waitSomeTime();

    const selector = `#topicPanel .well:nth-child(${topicIndex}) #headingOne`;
    const actionItemExpandElement = browser.element(selector).value.ELEMENT;
    const actionItemExpandElementText = browser.elementIdText(
      actionItemExpandElement,
    ).value;

    expect(
      actionItemExpandElementText,
      "no illegal responsible added",
    ).not.to.have.string(illegalUserName);
  });
});
