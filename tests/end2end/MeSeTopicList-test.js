import { E2EApp } from "./helpers/E2EApp";
import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";
import { E2EMeetingSeriesEditor } from "./helpers/E2EMeetingSeriesEditor";

describe("MeetingSeries complete Topic list", () => {
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

  it("copies all topics of the first minute to the parent series including both all info- and actionItems.", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item", itemType: "actionItem" },
      1,
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabTopics();

    expect(
      E2ETopics.countTopicsForMinute(),
      "Meeting Series should have one topic",
    ).to.equal(1);

    expect(
      E2ETopics.countItemsForTopic(1),
      "Topic should have two items",
    ).to.equal(2);

    const items = E2ETopics.getItemsForTopic(1);
    const firstItemElement = items[0].ELEMENT;
    expect(
      browser.elementIdText(firstItemElement).value,
      "fist element should be the action item",
    ).to.have.string("some action item");

    const sndElement = items[1].ELEMENT;
    expect(
      browser.elementIdText(sndElement).value,
      "2nd element should be the info item",
    ).to.have.string("some information");
  });

  it("closes the topic if it were discussed and has no open AI", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item", itemType: "actionItem" },
      1,
    );

    E2ETopics.toggleActionItem(1, 1);
    E2ETopics.toggleTopic(1);

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabTopics();

    expect(E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
  });

  it("remains the topic open if it were neither discussed nor has open AI", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item", itemType: "actionItem" },
      1,
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabTopics();

    expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
  });

  it("remains the topic open if it were not discussed but has no open AI", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item", itemType: "actionItem" },
      1,
    );

    E2ETopics.toggleTopic(1);

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabTopics();

    expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
  });

  it("remains the topic open if it were discussed but has open AI", () => {
    E2ETopics.addTopicToMinutes("some topic");
    E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
    E2ETopics.addInfoItemToTopic(
      { subject: "some action item", itemType: "actionItem" },
      1,
    );

    E2ETopics.toggleActionItem(1, 1);

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();

    E2EMeetingSeries.gotoTabTopics();

    expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be.false;
  });

  it("Closed Topics have a Re-open Button, open ones not", () => {
    E2ETopics.addTopicToMinutes("some open topic");
    E2ETopics.addTopicToMinutes("some closed topic");
    E2ETopics.toggleTopic(1);

    E2EMinutes.finalizeCurrentMinutes();
    E2EMinutes.gotoParentMeetingSeries();
    E2EMeetingSeries.gotoTabTopics();

    expect(E2ETopics.isTopicClosed(2), "Topic should be open").to.be.false;
    expect(E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;

    expect(E2ETopics.hasDropDownMenuButton(2, "#btnReopenTopic")).to.be.false;
    expect(E2ETopics.hasDropDownMenuButton(1, "#btnReopenTopic")).to.be.true;
  });

  it("Only Moderator can Re-Open a closed Topic", () => {
    E2ETopics.addTopicToMinutes("some closed topic");
    E2ETopics.toggleTopic(1);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save

    E2EApp.loginUser(1);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMeetingSeries.gotoTabTopics();

    expect(E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
    expect(E2ETopics.hasDropDownMenuButton(1, "#btnReopenTopic")).to.be.false;
    E2EApp.loginUser();
  });

  it("Reopen a Topic if there is no currently unfinalized Minute", () => {
    E2ETopics.addTopicToMinutes("some closed topic");
    E2ETopics.toggleTopic(1);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.gotoParentMeetingSeries();
    E2EMeetingSeries.gotoTabTopics();
    expect(E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;

    //try to reopen the topic
    E2ETopics.reOpenTopic(1);
    expect(E2ETopics.isTopicClosed(1), "Topic should be reopened").to.be.false;

    // currently finalized minute should not get the reopened Topic
    E2EMeetingSeries.gotoTabMinutes();
    E2EMinutes.gotoLatestMinutes();
    expect(E2ETopics.countTopicsForMinute()).to.equal(0);

    //a minute which is opened after reopening the topic should contain the topic
    E2EMinutes.gotoParentMeetingSeries();
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.gotoLatestMinutes();
    expect(E2ETopics.countTopicsForMinute()).to.equal(1);
  });

  it("Reopen a Topic if there is a currently unfinalized Minute", () => {
    E2ETopics.addTopicToMinutes("some closed topic");
    E2ETopics.toggleTopic(1);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    expect(E2ETopics.countTopicsForMinute()).to.equal(0);

    E2EMinutes.gotoParentMeetingSeries();
    E2EMeetingSeries.gotoTabTopics();
    E2ETopics.reOpenTopic(1);

    // the topic should have been copied to the latest minute
    E2EMeetingSeries.gotoTabMinutes();
    E2EMinutes.gotoLatestMinutes();
    E2EGlobal.waitSomeTime();
    expect(E2ETopics.countTopicsForMinute()).to.equal(1);
  });

  describe("merge topics", () => {
    beforeEach("Create and finalize a first minute", () => {
      E2ETopics.addTopicToMinutes("some topic");
      E2ETopics.addInfoItemToTopic({ subject: "some information" }, 1);
      E2ETopics.addInfoItemToTopic(
        { subject: "some action item", itemType: "actionItem" },
        1,
      );

      E2EMinutes.finalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();
    });

    it("clears the topic list if the first minute will be un-finalized.", () => {
      E2EMinutes.gotoLatestMinutes();

      E2EMinutes.unfinalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      expect(E2ETopics.countTopicsForMinute()).to.equal(0);
    });

    it("adds new topics and AIs/IIs to the topic list of the meeting series", () => {
      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      // add new items (AI and II) to existing topic
      E2ETopics.addInfoItemToTopic({ subject: "some other information" }, 1);
      E2ETopics.addInfoItemToTopic(
        { subject: "some other action item", itemType: "actionItem" },
        1,
      );

      // add a new topic
      E2ETopics.addTopicToMinutes("some other topic");
      E2ETopics.addInfoItemToTopic({ subject: "with information" }, 1);
      E2ETopics.addInfoItemToTopic(
        { subject: "with an action item", itemType: "actionItem" },
        1,
      );

      E2EMinutes.finalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      expect(
        E2ETopics.countTopicsForMinute(),
        "Meeting Series should have now two topics",
      ).to.equal(2);

      // check the first topic (this should be the new one)
      expect(
        E2ETopics.countItemsForTopic(1),
        "New Topic should have two items",
      ).to.equal(2);
      const itemsOfNewTopic = E2ETopics.getItemsForTopic(1);
      const firstItemOfNewTopic = itemsOfNewTopic[0].ELEMENT;
      expect(
        browser.elementIdText(firstItemOfNewTopic).value,
        "first item of new topic should be the action item",
      ).to.have.string("with an action item");
      const sndItemOfNewTopic = itemsOfNewTopic[1].ELEMENT;
      expect(
        browser.elementIdText(sndItemOfNewTopic).value,
        "2nd item of new topic should be the info item",
      ).to.have.string("with information");

      // check the 2nd topic (the merged one)
      expect(
        E2ETopics.countItemsForTopic(2),
        "Merged Topic should now have four items",
      ).to.equal(4);
    });

    it("closes an existing open AI but remains the topic open if it were not discussed", () => {
      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.toggleActionItem(1, 1);

      E2EMinutes.finalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      expect(
        E2ETopics.countTopicsForMinute(),
        "Meeting Series should still have only one topic",
      ).to.equal(1);

      expect(E2ETopics.isTopicClosed(1), "Topic should remain open").to.be
        .false;
      expect(E2ETopics.isActionItemClosed(1, 1), "AI should be closed").to.be
        .true;
    });

    it("closes an existing open AI and closes the topic if it were discussed", () => {
      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.toggleActionItem(1, 1);
      E2ETopics.toggleTopic(1);

      E2EMinutes.finalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      expect(
        E2ETopics.countTopicsForMinute(),
        "Meeting Series should still have only one topic",
      ).to.equal(1);

      expect(E2ETopics.isTopicClosed(1), "Topic should be closed").to.be.true;
      expect(E2ETopics.isActionItemClosed(1, 1), "AI should be closed").to.be
        .true;
    });

    it("changes the properties (subject/responsible) of an existing Topic", () => {
      const newTopicSubject = "changed topic subject";
      const newResponsible = "user1";

      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.editTopicForMinutes(1, newTopicSubject, newResponsible);

      E2EMinutes.finalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      const topicItems = E2ETopics.getTopicsForMinute();
      const topicEl = topicItems[0].ELEMENT;
      expect(
        browser.elementIdText(topicEl).value,
        "the topic subject should have changed",
      ).to.have.string(newTopicSubject);
      expect(
        browser.elementIdText(topicEl).value,
        "the topic responsible should have changed",
      ).to.have.string(newResponsible);
    });

    it("reverts property changes (subject/responsible) of a Topic if the minute will be un-finalized", () => {
      const newTopicSubject = "changed topic subject";
      const newResponsible = "user1";

      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.editTopicForMinutes(1, newTopicSubject, newResponsible);

      E2EMinutes.finalizeCurrentMinutes();
      E2EMinutes.unfinalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      const topicItems = E2ETopics.getTopicsForMinute();
      const topicEl = topicItems[0].ELEMENT;
      expect(
        browser.elementIdText(topicEl).value,
        "the topic subject should have changed",
      ).to.not.have.string(newTopicSubject);
      expect(
        browser.elementIdText(topicEl).value,
        "the topic responsible should have changed",
      ).to.not.have.string(newResponsible);
    });

    it("changes the properties (subject/responsible) of an existing AI", () => {
      const newSubject = "changed action item subject";
      const newResponsible = "user1";

      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.editInfoItemForTopic(1, 1, {
        subject: newSubject,
        responsible: newResponsible,
      });

      E2EMinutes.finalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      const items = E2ETopics.getItemsForTopic(1);
      const firstItemElement = items[0].ELEMENT;
      expect(
        browser.elementIdText(firstItemElement).value,
        "the action item subject should have changed",
      ).to.have.string(newSubject);
      expect(
        browser.elementIdText(firstItemElement).value,
        "the action item responsible should have changed",
      ).to.have.string(newResponsible);
    });

    it("reverts property changes (subject/responsible) of an AI if the minute will be un-finalized", () => {
      const newSubject = "changed action item subject";
      const newResponsible = "user1";

      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.editInfoItemForTopic(1, 1, {
        subject: newSubject,
        responsible: newResponsible,
      });

      E2EMinutes.finalizeCurrentMinutes();
      E2EMinutes.unfinalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      const items = E2ETopics.getItemsForTopic(1);
      const firstItemElement = items[0].ELEMENT;
      expect(
        browser.elementIdText(firstItemElement).value,
        "the action item subject should have changed",
      ).to.not.have.string(newSubject);
      expect(
        browser.elementIdText(firstItemElement).value,
        "the action item responsible should have changed",
      ).to.not.have.string(`Resp: ${newResponsible}`);
    });

    it("removes the is-New-Flag of an existing topic after finalizing the 2nd minute", () => {
      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
      E2EMinutes.finalizeCurrentMinutes();
      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      const items = E2ETopics.getItemsForTopic(1);
      const firstItemElement = items[0].ELEMENT;
      expect(browser.elementIdText(firstItemElement).value).to.not.have.string(
        "New",
      );
    });

    it("restores the is-New-Flag of an existing topic after un-finalizing the 2nd minute", () => {
      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
      E2EMinutes.finalizeCurrentMinutes();
      E2EMinutes.unfinalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      const items = E2ETopics.getItemsForTopic(1);
      const firstItemElement = items[0].ELEMENT;
      expect(browser.elementIdText(firstItemElement).value).to.have.string(
        "New",
      );
    });

    it("removes the topic from the meeting series topics list if it was created int the un-finalized minutes", () => {
      // add a second minute
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      // add a new topic
      E2ETopics.addTopicToMinutes("some other topic");
      E2ETopics.addInfoItemToTopic({ subject: "with information" }, 1);
      E2ETopics.addInfoItemToTopic(
        { subject: "with an action item", itemType: "actionItem" },
        1,
      );

      E2EMinutes.finalizeCurrentMinutes();
      E2EMinutes.unfinalizeCurrentMinutes();

      E2EMinutes.gotoParentMeetingSeries();

      E2EMeetingSeries.gotoTabTopics();

      expect(E2ETopics.countTopicsForMinute()).to.equal(1);
    });
  });
});
