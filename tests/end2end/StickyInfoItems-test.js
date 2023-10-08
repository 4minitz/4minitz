import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";
import { E2EGlobal } from "./helpers/E2EGlobal";

require("../../imports/helpers/date");

describe("Sticky Info Items", () => {
  const aProjectName = "E2E Sticky Info Items";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;
  let aTopicCounter = 0;
  const aTopicNameBase = "Topic Name #";
  let aTopicName;
  let aInfoItemName = "";
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
  const getNewInfoItemName = () => {
    aAICounter++;
    aInfoItemName = aAINameBase + aAICounter;
    return aInfoItemName;
  };

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

      E2ETopics.addInfoItemToTopic(
        {
          subject: getNewInfoItemName(),
          infoItemType: "infoItem",
        },
        1,
      );
    },
  );

  it("is possible to toggle the sticky-state of info items", () => {
    E2ETopics.toggleInfoItemStickyState(1, 1);
    expect(E2ETopics.isInfoItemSticky(1, 1)).to.be.true;
  });

  it("ensures that sticky-info-items will be presented in the next minute again", () => {
    E2ETopics.toggleInfoItemStickyState(1, 1);

    E2EMinutes.finalizeCurrentMinutes();
    E2EMinutes.gotoParentMeetingSeries();

    // add a second minute
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    expect(
      E2ETopics.countItemsForTopic(1),
      "The topic should have one item",
    ).to.equal(1);
    const itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
    const stickyInfoItem = itemsOfNewTopic[0].ELEMENT;
    expect(
      browser.elementIdText(stickyInfoItem).value,
      "the sticky info item should be displayed",
    ).to.have.string(aInfoItemName);

    expect(E2ETopics.isInfoItemSticky(1, 1)).to.be.true;
  });

  it("closes a discussed topic which has a sticky-info-item but no open AIs and does not present the topic in the next minute again", () => {
    E2ETopics.toggleInfoItemStickyState(1, 1);
    E2ETopics.toggleTopic(1);

    E2EMinutes.finalizeCurrentMinutes();
    E2EMinutes.gotoParentMeetingSeries();

    // add a second minute
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    expect(
      E2ETopics.countTopicsForMinute(),
      "the new minute should have no topics",
    ).to.equal(0);
  });

  it("ensures that the sticky-status of an info item in a finalized minute can not be modified", () => {
    E2EMinutes.finalizeCurrentMinutes();

    E2ETopics.toggleInfoItemStickyState(1, 1);
    expect(
      E2ETopics.isInfoItemSticky(1, 1),
      "non-sticky item should not have changed state",
    ).to.be.false;

    E2EMinutes.unfinalizeCurrentMinutes();
    E2ETopics.toggleInfoItemStickyState(1, 1);
    E2EMinutes.finalizeCurrentMinutes();

    expect(
      E2ETopics.isInfoItemSticky(1, 1),
      "sticky item should have changed state",
    ).to.be.true;
  });

  it("can not change the sticky status of info-items on the topics page of the meeting series", () => {
    E2ETopics.addInfoItemToTopic(
      {
        subject: getNewInfoItemName(),
        infoItemType: "infoItem",
      },
      1,
    );
    E2ETopics.toggleInfoItemStickyState(1, 1);

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();
    E2EMeetingSeries.gotoTabTopics();

    E2ETopics.toggleInfoItemStickyState(1, 1);
    expect(
      E2ETopics.isInfoItemSticky(1, 1),
      "sticky item should not have changed state",
    ).to.be.true;

    E2ETopics.toggleInfoItemStickyState(1, 2);
    expect(
      E2ETopics.isInfoItemSticky(1, 2),
      "non-sticky item should not have changed state",
    ).to.be.false;
  });

  it(
    "ensures that changing the subject of a sticky-info-item also updates the related item located " +
      "in the topic list of the meeting series after finalizing the minute",
    () => {
      const newInfoItemName = "updated info item subject";

      E2ETopics.toggleInfoItemStickyState(1, 1);
      E2EMinutes.finalizeCurrentMinutes();
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.editInfoItemForTopic(1, 1, { subject: newInfoItemName });
      E2EMinutes.finalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();
      E2EMeetingSeries.gotoTabTopics();

      expect(
        E2ETopics.countItemsForTopic(1),
        "topic should have one item",
      ).to.equal(1);

      const itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
      const stickyInfoItem = itemsOfNewTopic[0].ELEMENT;
      expect(
        browser.elementIdText(stickyInfoItem).value,
        "the subject of the sticky info item should have changed",
      ).to.have.string(newInfoItemName);

      expect(
        E2ETopics.isInfoItemSticky(1, 1),
        "the info item should be still sticky",
      ).to.be.true;
    },
  );
});
