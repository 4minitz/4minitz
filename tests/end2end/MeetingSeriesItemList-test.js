import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

import { formatDateISO8601 } from "../../imports/helpers/date";

describe("MeetingSeries Items list", () => {
  const aProjectName = "MeetingSeries Topic List";
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

  it("displays all info- and action-items of all topics", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item", itemType: "actionItem" },
      1,
    );

    E2ETopics.addTopicToMinutes("some other topic");
    E2ETopics.addInfoItemToTopic(
      { subject: "some information of another topic" },
      1,
    );
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item of another topic", itemType: "actionItem" },
      1,
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabItems();

    expect(
      E2ETopics.getAllItemsFromItemList().length,
      "List should have 4 items",
    ).to.equal(4);

    expect(
      E2ETopics.getNthItemFromItemList(0).value,
      "First item should have correct subject",
    ).to.have.string("some action item of another topic");
    expect(
      E2ETopics.getNthItemFromItemList(1).value,
      "First item should have correct subject",
    ).to.have.string("some information of another topic");
    expect(
      E2ETopics.getNthItemFromItemList(2).value,
      "First item should have correct subject",
    ).to.have.string("some action item");
    expect(
      E2ETopics.getNthItemFromItemList(3).value,
      "First item should have correct subject",
    ).to.have.string("some information");
  });

  it("can expand an info item to display its details on the item list", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addDetailsToActionItem(
      1,
      1,
      "Amazing details for this information item",
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabItems();

    E2ETopics.expandDetailsForNthInfoItem(1);

    expect(E2ETopics.getNthItemFromItemList(0).value).to.have.string(
      formatDateISO8601(new Date()) +
        " New" +
        "\nAmazing details for this information item",
    );
  });
});
