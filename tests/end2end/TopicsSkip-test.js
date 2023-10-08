import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMeetingSeriesEditor } from "./helpers/E2EMeetingSeriesEditor";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";
import { E2EMails } from "./helpers/E2EMails";

describe("Topics Skip", () => {
  const aProjectName = "E2E Topics Skip";
  let aMeetingCounter = 0;
  const aMeetingNameBase = "Meeting Name #";
  let aMeetingName;

  const nonSkippedTopicName = "Non-skipped Topic #1";
  const skippedTopicName = "Skipped Topic #2";

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach(
    "goto start page and make sure test user is logged in. Also create two topics",
    () => {
      E2EApp.gotoStartPage();
      expect(E2EApp.isLoggedIn()).to.be.true;

      aMeetingCounter++;
      aMeetingName = aMeetingNameBase + aMeetingCounter;

      E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.addTopicToMinutes(skippedTopicName);
      E2ETopics.addTopicToMinutes(nonSkippedTopicName);
      expect(E2ETopics.countTopicsForMinute()).to.equal(2);

      expect(E2ETopics.isTopicSkipped(1)).to.be.false;
      expect(E2ETopics.isTopicSkipped(2)).to.be.false;
    },
  );

  it("Can skip and unskip topic", () => {
    const skipAndUnskipTopicViaUI = (useDropdownMenu) => {
      E2ETopics.toggleSkipTopic(2, true); //skip
      expect(E2ETopics.isTopicSkipped(1)).to.be.false;
      expect(E2ETopics.isTopicSkipped(2)).to.be.true;
      E2ETopics.toggleSkipTopic(2, useDropdownMenu); //unskip
      expect(E2ETopics.isTopicSkipped(1)).to.be.false;
      expect(E2ETopics.isTopicSkipped(2)).to.be.false;
    };

    //Check skip & unskip via dropdown menu
    skipAndUnskipTopicViaUI(true);
    //Check unskip by directly pressing the skip icon
    skipAndUnskipTopicViaUI(false);
  });

  it("Skipping closed topics will open them and they cannot be closed again", () => {
    E2ETopics.toggleTopic(2);
    expect(E2ETopics.isTopicClosed(2)).to.be.true;

    E2ETopics.toggleSkipTopic(2);
    expect(E2ETopics.isTopicSkipped(2)).to.be.true;
    expect(E2ETopics.isTopicClosed(2)).to.be.false; // topic has been opened again

    E2ETopics.toggleTopic(2);
    expect(E2ETopics.isTopicClosed(2)).to.be.false; // topic has not been opened again, since the checkbox is not editable
  });

  it("Skipped topics will not be included in agenda mails", () => {
    E2EMails.resetSentMailsDb();

    E2ETopics.toggleSkipTopic(2, true);
    browser.waitForVisible("#btn_sendAgenda");
    E2EGlobal.clickWithRetry("#btn_sendAgenda");

    E2EGlobal.waitSomeTime();

    const sentMails = E2EMails.getAllSentMails();
    expect(sentMails, "one mail should be sent").to.have.length(1);

    const sentMail = sentMails[0];
    expect(
      sentMail.html,
      "the email should contain the subject of the topic",
    ).to.have.string(nonSkippedTopicName);
    expect(
      sentMail.html,
      "the email should not contain the subject of the skipped topic",
    ).to.not.have.string(skippedTopicName);
  });

  it("Skipped topics will not be included in info item mails", () => {
    const skippedInfoItemTitle = "This is an Infoitem within a skipped Topic";
    const nonSkippedInfoItemTitle =
      "This is an Infoitem within a non-skipped Topic";

    E2EMails.resetSentMailsDb();
    E2ETopics.toggleSkipTopic(2, true);
    E2ETopics.addInfoItemToTopic(
      {
        subject: nonSkippedInfoItemTitle,
        itemType: "infoItem",
      },
      1,
    );
    E2ETopics.addInfoItemToTopic(
      {
        subject: skippedInfoItemTitle,
        itemType: "infoItem",
      },
      2,
    );

    E2EMinutes.finalizeCurrentMinutes(true);
    E2EGlobal.waitSomeTime();

    const sentMails = E2EMails.getAllSentMails();
    expect(sentMails, "one mail should be sent").to.have.length(1);
    const sentMail = sentMails[0];
    expect(
      sentMail.html,
      "the email should contain the title of the non-skipped Topic's InfoItem",
    ).to.have.string(nonSkippedInfoItemTitle);
    expect(
      sentMail.html,
      "the email should not contain the title of the skipped Topic's InfoItem",
    ).to.not.have.string(skippedInfoItemTitle);
  });

  it("Skipped topics will not be included in action item mails", () => {
    const skippedActionItemTitle =
      "This is an ActionItem within a skipped Topic";
    const nonSkippedActionItemTitle =
      "This is an ActionItem within a non-skipped Topic";

    E2EMails.resetSentMailsDb();
    E2ETopics.toggleSkipTopic(2, true);
    E2ETopics.addInfoItemToTopic(
      {
        subject: nonSkippedActionItemTitle,
        itemType: "actionItem",
        responsible: E2EApp.getCurrentUser(),
      },
      1,
    );
    E2ETopics.addInfoItemToTopic(
      {
        subject: skippedActionItemTitle,
        itemType: "actionItem",
        responsible: E2EApp.getCurrentUser(),
      },
      2,
    );

    E2EMinutes.finalizeCurrentMinutes(true);
    E2EGlobal.waitSomeTime();

    const sentMails = E2EMails.getAllSentMails();
    expect(
      sentMails,
      "two mail should be sent. One for the ActionItems, the other for the InfoItems",
    ).to.have.length(2);
    const sentMail = sentMails[0]; //ActionItem Mail will be sent first
    expect(
      sentMail.html,
      "the email should contain the title of the non-skipped Topic's ActionItem",
    ).to.have.string(nonSkippedActionItemTitle);
    expect(
      sentMail.html,
      "the email should not contain the title of the skipped Topic's ActionItem",
    ).to.not.have.string(skippedActionItemTitle);
  });

  it("Skipped topics can only be seen by the moderator", () => {
    E2ETopics.toggleSkipTopic(2, true);
    //Moderator can see Topic
    const selector = "#topicPanel .well:nth-child(2) #btnTopicDropdownMenu";
    expect(browser.isVisible(selector)).to.be.true;

    //Add another participant
    E2EMinutes.gotoParentMeetingSeries();
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(
      aProjectName,
      aMeetingName,
      "invited",
    );
    E2EGlobal.waitSomeTime(750);
    const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
    E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor(); // close with save
    //check if new non-moderator-participant can see skipped topic
    E2EApp.loginUser(1);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EGlobal.waitSomeTime();
    E2EMinutes.gotoLatestMinutes();
    expect(browser.isVisible(selector)).to.be.false;

    E2EApp.loginUser();
  });

  it("Hide closed Topics button will also hide skipped topics", () => {
    E2ETopics.toggleSkipTopic(2, true);
    const selector = "#topicPanel .well:nth-child(2) #btnTopicDropdownMenu";
    expect(browser.isVisible(selector)).to.be.true;
    E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");
    E2EGlobal.waitSomeTime();
    expect(browser.isVisible(selector)).to.be.false;
    E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");
  });

  it("Skipped topics will appear unskipped in the next minute", () => {
    E2ETopics.toggleSkipTopic(2, true);
    expect(E2ETopics.isTopicSkipped(2)).to.be.true;
    E2EMinutes.finalizeCurrentMinutes(true);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.gotoLatestMinutes();
    expect(E2ETopics.isTopicSkipped(2)).to.be.false;
  });
});
