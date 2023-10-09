import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

describe("Topics Delete - Forbid deleting topics which were not created within the current minutes", () => {
  const aProjectName = "E2E Topics Delete";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;

  const EXISTING_TOPIC = "existing topic";
  const EXISTING_ACTION = "existing action item";
  const EXISTING_STICKY_INFO = "existing sticky info item";

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
    E2ETopics.addTopicToMinutes(EXISTING_TOPIC);
    E2ETopics.addInfoItemToTopic(
      {
        subject: EXISTING_ACTION,
        itemType: "actionItem",
      },
      1,
    );
    E2ETopics.addInfoItemToTopic(
      {
        subject: EXISTING_STICKY_INFO,
        itemType: "infoItem",
      },
      1,
    );
    E2ETopics.toggleInfoItemStickyState(1, 1);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
  });

  it("is allowed to delete a topic which was created within the current minutes even if it has open action items", () => {
    E2ETopics.addTopicToMinutes("fresh created topic");
    E2ETopics.addInfoItemToTopic(
      {
        subject: "fresh action item",
        itemType: "actionItem",
      },
      1,
    );
    expect(E2ETopics.countTopicsForMinute()).to.equal(2);
    E2ETopics.deleteTopic(1, true);
    expect(E2ETopics.countTopicsForMinute()).to.equal(1);
  });

  it("closes the topic together with its open action items instead of deleting it", () => {
    E2ETopics.deleteTopic(1, true);
    expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    expect(E2ETopics.isTopicClosed(1), "the topic should be closed now").to.be
      .true;
    expect(
      E2ETopics.isActionItemClosed(1, 2),
      "the action item should be closed, too",
    ).to.be.true;
  });

  it("shows a info dialog and does nothing if the topic and its actions are already closed", () => {
    E2ETopics.toggleTopic(1);
    E2ETopics.toggleActionItem(1, 2);
    E2ETopics.deleteTopic(1);

    const selectorDialog = "#confirmDialog";
    E2EGlobal.waitSomeTime(750); // give dialog animation time
    expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be
      .true;

    const dialogContentElement = browser.element(
      `${selectorDialog} .modal-header`,
    ).value.ELEMENT;
    const dialogContentTitle =
      browser.elementIdText(dialogContentElement).value;

    expect(dialogContentTitle).to.have.string("Cannot delete topic");

    // close dialog otherwise beforeEach-hook will fail!
    E2EGlobal.clickWithRetry("#confirmationDialogOK");
    E2EGlobal.waitSomeTime();
  });

  it("closes the action item instead of deleting it", () => {
    E2ETopics.deleteInfoItem(1, 2, true);
    expect(E2ETopics.isActionItemClosed(1, 2), "the AI should be closed").to.be
      .true;
  });

  it("closes the action item instead of deleting it even it was recently edited", () => {
    const topicIndex = 1,
      itemIndex = 2,
      UPDATED_SUBJECT = `${EXISTING_ACTION} (updated)`;
    E2ETopics.editInfoItemForTopic(topicIndex, itemIndex, {
      subject: UPDATED_SUBJECT,
    });
    E2ETopics.deleteInfoItem(topicIndex, itemIndex, true);
    expect(
      E2ETopics.isActionItemClosed(topicIndex, 2),
      "the AI should be closed",
    ).to.be.true;
  });

  it("unpins the sticky info item instead of deleting it", () => {
    E2ETopics.deleteInfoItem(1, 1, true);
    expect(E2ETopics.isInfoItemSticky(1, 1)).to.be.false;
  });
});
