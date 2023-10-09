import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";
import { E2EGlobal } from "./helpers/E2EGlobal";

// This test might be helpful if there is a bug with our migrations
// The tests creates a series with two minutes containing action and info items
// After that you can migrate down to a specific version and migrate up step by step. After each step
// the amount of items will be count
describe.skip("Migrations", () => {
  const aProjectName = "Migrations";
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

  it("should not change meeting series topics history when migration down and up", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "action item", itemType: "actionItem" },
      1,
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    E2ETopics.toggleActionItem(1, 1);
    E2ETopics.addInfoItemToTopic({ subject: "new information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "new action item", itemType: "actionItem" },
      1,
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    const checkHistory = () => {
      const url = browser.getUrl();
      const msId = url.slice(url.lastIndexOf("/") + 1);

      const topics = server.call("e2e.getTopicsOfMeetingSeries", msId);

      expect(topics.length, "Meeting Series should have one topic").to.equal(1);
      expect(
        topics[0].infoItems.length,
        "Topic should have four items",
      ).to.equal(4);
    };

    checkHistory(20);

    E2EGlobal.waitSomeTime(500);

    const startAtVersion = 17;
    server.call("e2e.triggerMigration", startAtVersion);

    for (let i = startAtVersion + 1; i <= 21; i++) {
      server.call("e2e.triggerMigration", i);
      console.log(`migrated to version ${i}`);
      E2EGlobal.waitSomeTime(1000);
      checkHistory();
    }
  });
});
