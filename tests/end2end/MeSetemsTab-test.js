import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

describe("MeetingSeries Items Tab", () => {
  const aProjectName = "MeetingSeries Items Tab";
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

  it("can filter the list of items", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item", itemType: "actionItem" },
      1,
    );
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item with information", itemType: "actionItem" },
      1,
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabItems();

    expect(
      E2ETopics.countItemsForTopic("#itemPanel"),
      "Items list should have three items",
    ).to.equal(3);

    browser.setValue("#inputFilter", "information");
    expect(
      E2ETopics.countItemsForTopic("#itemPanel"),
      "Items list should have now two items",
    ).to.equal(2);
  });
});
