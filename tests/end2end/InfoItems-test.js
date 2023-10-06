import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

describe("Info Items", function () {
  const aProjectName = "E2E Info Items";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;
  let aTopicCounter = 0;
  const aTopicNameBase = "Topic Name #";
  let aTopicName;
  let aAICounter = 0;
  const aAINameBase = "Info Item Name #";

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

  before("reload page and reset app", function () {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach(
    "make sure test user is logged in, create series and add minutes",
    function () {
      E2EApp.gotoStartPage();
      expect(E2EApp.isLoggedIn()).to.be.true;

      aMeetingName = getNewMeetingName();

      E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      aTopicName = getNewTopicName();
      E2ETopics.addTopicToMinutes(aTopicName);
    },
  );

  it("can add an info item", function () {
    const topicIndex = 1;
    const infoItemName = getNewAIName();
    E2ETopics.addInfoItemToTopic(
      {
        subject: infoItemName,
        itemType: "infoItem",
      },
      topicIndex,
    );

    E2EGlobal.waitSomeTime();

    const selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
    expect(browser.isVisible(selector), "Info item should be visible").to.be
      .true;

    const infoItemExpandElement = browser.element(selector).value.ELEMENT;
    const infoItemExpandElementText = browser.elementIdText(
      infoItemExpandElement,
    ).value;

    expect(
      infoItemExpandElementText,
      "Info item visible text should match",
    ).to.have.string(infoItemName);
  });

  it("shows security question before deleting info items", function () {
    const infoItemName = getNewAIName();
    E2ETopics.addInfoItemToTopic(
      {
        subject: infoItemName,
        itemType: "infoItem",
      },
      1,
    );

    E2ETopics.deleteInfoItem(1, 1);

    const selectorDialog = "#confirmDialog";

    E2EGlobal.waitSomeTime(750); // give dialog animation time
    expect(browser.isVisible(selectorDialog), "Dialog should be visible").to.be
      .true;

    const dialogContentElement = browser.element(
      selectorDialog + " .modal-body",
    ).value.ELEMENT;
    const dialogContentText = browser.elementIdText(dialogContentElement).value;

    expect(
      dialogContentText,
      "dialog content should display the title of the to-be-deleted object",
    ).to.have.string(infoItemName);
    expect(
      dialogContentText,
      "dialog content should display the correct type of the to-be-deleted object",
    ).to.have.string("information");

    // close dialog otherwise beforeEach-hook will fail!
    E2EApp.confirmationDialogAnswer(false);
  });

  it("can delete an info item", function () {
    const topicIndex = 1;
    const infoItemName = getNewAIName();
    E2ETopics.addInfoItemToTopic(
      {
        subject: infoItemName,
        itemType: "infoItem",
      },
      topicIndex,
    );

    E2EGlobal.waitSomeTime();

    const selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
    expect(browser.isVisible(selector), "Info item should be visible").to.be
      .true;

    E2ETopics.deleteInfoItem(1, 1, true);
    expect(browser.isVisible(selector), "Info item should be deleted").to.be
      .false;
  });

  it('can cancel a "delete info item"', function () {
    const topicIndex = 1;
    const infoItemName = getNewAIName();
    E2ETopics.addInfoItemToTopic(
      {
        subject: infoItemName,
        itemType: "infoItem",
      },
      topicIndex,
    );

    E2EGlobal.waitSomeTime();

    const selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
    expect(browser.isVisible(selector), "Info item should be visible").to.be
      .true;

    E2ETopics.deleteInfoItem(1, 1, false);
    expect(browser.isVisible(selector), "Info item should still exist").to.be
      .true;
  });

  it("can submit an info item by pressing enter in the topic field", function () {
    const topicIndex = 1;
    E2ETopics.openInfoItemDialog(topicIndex, "infoItem");

    const infoItemName = getNewAIName();
    E2ETopics.insertInfoItemDataIntoDialog({
      subject: infoItemName,
      itemType: "infoItem",
    });

    const subjectInput = browser.$("#id_item_subject");
    subjectInput.keys("Enter");

    E2EGlobal.waitSomeTime();

    const selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
    expect(browser.isVisible(selector), "Info item should be visible").to.be
      .true;

    const infoItemExpandElement = browser.element(selector).value.ELEMENT;
    const infoItemExpandElementText = browser.elementIdText(
      infoItemExpandElement,
    ).value;

    expect(
      infoItemExpandElementText,
      "Info item visible text should match",
    ).to.have.string(infoItemName);
  });

  it("can edit an info item", function () {
    const topicIndex = 1;
    E2ETopics.addInfoItemToTopic(
      {
        subject: "Old Item Subject",
        itemType: "infoItem",
        label: "Proposal",
      },
      topicIndex,
    );
    E2EGlobal.waitSomeTime();

    E2ETopics.openInfoItemEditor(topicIndex, 1);
    E2EGlobal.waitSomeTime();
    E2ETopics.insertInfoItemDataIntoDialog({
      subject: "New Item Subject",
      itemType: "infoItem",
      label: "Decision",
    });
    E2ETopics.submitInfoItemDialog();

    // Check new subject text
    const selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #headingOne";
    expect(
      browser.isVisible(selector),
      "Info item should be visible after edit",
    ).to.be.true;
    let infoItemExpandElement = browser.element(selector).value.ELEMENT;
    let infoItemExpandElementText = browser.elementIdText(
      infoItemExpandElement,
    ).value;
    expect(
      infoItemExpandElementText,
      "Info item subject text should match after edit",
    ).to.have.string("New Item Subject");

    // Check new label
    const newLabelSelector =
      "#topicPanel .well:nth-child(" + topicIndex + ") .label:nth-child(1)";
    expect(browser.isVisible(newLabelSelector), "New label should be visible")
      .to.be.true;
    infoItemExpandElement = browser.element(newLabelSelector).value.ELEMENT;
    infoItemExpandElementText = browser.elementIdText(
      infoItemExpandElement,
    ).value;
    expect(
      infoItemExpandElementText,
      "New label text should match",
    ).to.have.string("Decision");
  });

  it("can edit the 2nd info item after creating three of them", function () {
    const topicIndex = 1;
    for (let i = 1; i < 4; i++) {
      E2ETopics.addInfoItemToTopic(
        {
          subject: `Info Item #${i}`,
          itemType: "infoItem",
        },
        topicIndex,
      );
      E2EGlobal.waitSomeTime();
      if (i === 2) {
        // edit the first (last added) entry after adding the 2nd one.
        E2ETopics.openInfoItemEditor(topicIndex, 1);
        E2EGlobal.waitSomeTime();
        E2ETopics.submitInfoItemDialog();
      }
    }

    for (let i = 1; i > 4; i++) {
      // Check new subject text
      const selector = `#topicPanel .well:nth-child(${topicIndex}) .topicInfoItem:nth-child(${i})`;
      expect(browser.isVisible(selector), `Info Item ${i} should be visible`).to
        .be.true;
      const infoItemExpandElement = browser.element(selector).value.ELEMENT;
      const infoItemExpandElementText = browser.elementIdText(
        infoItemExpandElement,
      ).value;
      expect(
        infoItemExpandElementText,
        `Info Item ${i} should be added correctly`,
      ).to.have.string(`Info Item #${i}`);
    }

    // Check if the 2nd item can be edited correctly
    E2ETopics.openInfoItemEditor(topicIndex, 2);
    E2EGlobal.waitSomeTime();
    E2ETopics.insertInfoItemDataIntoDialog({
      subject: "Info Item #2 - changed",
      itemType: "infoItem",
    });
    E2ETopics.submitInfoItemDialog();

    const selector = `#topicPanel .well:nth-child(${topicIndex}) .topicInfoItem:nth-child(2)`;
    const infoItemExpandElement = browser.element(selector).value.ELEMENT;
    const infoItemExpandElementText = browser.elementIdText(
      infoItemExpandElement,
    ).value;
    expect(
      infoItemExpandElementText,
      `Info Item 2 should be edited correctly`,
    ).to.have.string("Info Item #2 - changed");
  });
});
