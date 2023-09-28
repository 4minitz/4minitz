import { E2EGlobal } from "./helpers/E2EGlobal";
import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EMinutes } from "./helpers/E2EMinutes";
import { E2ETopics } from "./helpers/E2ETopics";

describe("Minutes Finalize", function () {
  const aProjectName = "E2E Minutes Finalize";
  let aMeetingCounter = 0;
  let aMeetingNameBase = "Meeting Name #";
  let aMeetingName;

  before("reload page and reset app", function () {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  beforeEach(
    "goto start page and make sure test user is logged in",
    function () {
      E2EApp.gotoStartPage();
      expect(E2EApp.isLoggedIn()).to.be.true;
    },
  );

  it("can finalize minutes", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(0);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.false;
    E2EMinutes.finalizeCurrentMinutes();

    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.true;
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
  });

  // this test does only make sense if mail delivery is enabled
  if (E2EGlobal.SETTINGS.email?.enableMailDelivery) {
    it("asks if emails should be sent before finalizing the minute", function () {
      aMeetingCounter++;
      aMeetingName = aMeetingNameBase + aMeetingCounter;

      E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
      E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

      E2ETopics.addTopicToMinutes("some topic");
      E2ETopics.addInfoItemToTopic(
        {
          subject: "action item",
          itemType: "actionItem",
        },
        1,
      );
      E2ETopics.addInfoItemToTopic(
        {
          subject: "info item",
          itemType: "infoItem",
        },
        1,
      );

      E2EMinutes.finalizeCurrentMinutes(/*autoConfirmDialog*/ false);

      expect(browser.isExisting("#cbSendAI")).to.be.true;
      expect(browser.isExisting("#cbSendII")).to.be.true;

      // close dialog otherwise beforeEach-hook will fail!
      E2EApp.confirmationDialogAnswer(false);
      E2EGlobal.waitSomeTime(300); // make next test happy
    });
  }

  it("can not add minutes if unfinalized minutes exist", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    let countInitialMinutes = E2EMinutes.countMinutesForSeries(
      aProjectName,
      aMeetingName,
    );

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    // No finalize here!
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    browser.waitForVisible("#btnAddMinutes");

    // check that nothing happens if the add minutes button will be pressed
    const urlBefore = browser.getUrl();
    expect(
      browser.isExisting("#btnAddMinutes"),
      "btnAddMinutes should be there",
    ).to.be.true;
    try {
      E2EGlobal.clickWithRetry("#btnAddMinutes");
    } catch (e) {
      // Intentionally left empty
      // We expect the above click to fail, as button is disabled
    }
    E2EGlobal.waitSomeTime(750);
    expect(browser.getUrl(), "Route should not have changed").to.equal(
      urlBefore,
    );
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
      "Only one minute should have been added",
    ).to.equal(countInitialMinutes + 1);
  });

  it("can finalize minutes at later timepoint", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    let countInitialMinutes = E2EMinutes.countMinutesForSeries(
      aProjectName,
      aMeetingName,
    );

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    // No finalize here!
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    browser.waitForVisible("#btnAddMinutes");
    E2EGlobal.clickWithRetry("a#id_linkToMinutes"); // goto first available minutes
    // Now finalize!
    E2EMinutes.finalizeCurrentMinutes();
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

    // check if button is clicked, it does add 2nd minutes
    E2EGlobal.clickWithRetry("#btnAddMinutes");
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(countInitialMinutes + 2);
  });

  it("can not delete or finalize already finalized minutes", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    let myDate = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
    E2EMinutes.finalizeCurrentMinutes();
    E2EMinutes.gotoMinutes(myDate);

    expect(browser.isExisting("#btn_finalizeMinutes")).to.be.false;
    expect(browser.isExisting("#btn_deleteMinutes")).to.be.false;
  });

  it("can unfinalize minutes", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    let myDate = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.unfinalizeCurrentMinutes();
    expect(browser.isExisting("#btn_finalizeMinutes")).to.be.true;
    expect(browser.isExisting("#btn_deleteMinutes")).to.be.true;
  });

  it("removes all fresh info items when unfinalizing the second minutes", function () {
    this.timeout(150000);
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    console.log("Meeting: ", aProjectName, aMeetingName);
    let myDate = "2015-05-14";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

    E2ETopics.addTopicToMinutes("Topic");
    E2ETopics.addInfoItemToTopic(
      {
        subject: "Old Info Item",
        itemType: "infoItem",
      },
      1,
    );

    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
    E2ETopics.addInfoItemToTopic(
      {
        subject: "New Info Item",
        itemType: "infoItem",
      },
      1,
    );
    E2EMinutes.finalizeCurrentMinutes();

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMeetingSeries.gotoTabTopics();

    expect(
      E2ETopics.countItemsForTopic(1),
      "Topic should have two items",
    ).to.equal(2);

    E2EMeetingSeries.gotoTabMinutes();
    E2EMinutes.gotoLatestMinutes();

    E2EMinutes.unfinalizeCurrentMinutes();

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMeetingSeries.gotoTabTopics();

    expect(
      E2ETopics.countItemsForTopic(1),
      "Topic should have one items",
    ).to.equal(1);
  });

  it("does show name of user that did finalize", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    let myDate = "2015-03-17"; // date of first project commit ;-)
    let currentUsername = E2EGlobal.SETTINGS.e2eTestUsers[0];

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
    E2EMinutes.finalizeCurrentMinutes();
    E2EGlobal.waitSomeTime();
    let finalizedText = browser.getText("#txt_FinalizedBy");
    expect(finalizedText).to.contain(currentUsername);

    // Now leave and re-enter minutes to trigger fresh render
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.gotoMinutes(myDate);
    finalizedText = browser.getText("#txt_FinalizedBy");
    expect(finalizedText).to.contain(currentUsername);
  });

  it("prohibits editing date of finalized minutes", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    let myDate = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);
    E2EMinutes.finalizeCurrentMinutes();

    let dateOfMinutes = browser.getValue("#id_minutesdateInput");
    expect(dateOfMinutes).to.equal(myDate);
    // try to change read-only field... we expect an exception in the next statement...  ;-)
    try {
      browser.setValue("#id_minutesdateInput", "2015-05-22");
    } catch (e) {}
    dateOfMinutes = browser.getValue("#id_minutesdateInput");
    expect(dateOfMinutes).to.equal(myDate); // still same as above?
  });

  it("prohibits unfinalizing of non-latest minutes", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    let myDate1 = "2015-03-17"; // date of first project commit ;-)
    let myDate2 = "2015-03-18";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate2); // myDate2 is kept UNFINALIZED!

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.gotoMinutes(myDate1);
    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.false;

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName); // now FINALIZE myDate2
    E2EMinutes.gotoMinutes(myDate2);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.gotoMinutes(myDate1);
    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.false;
  });

  it("prohibits minutes on dates before the latest minutes", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    let myDate1 = "2015-03-17"; // date of first project commit ;-)
    let myDate2 = "2010-01-01";

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate2);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

    expect(E2EMinutes.getMinutesId(myDate2)).not.to.be.ok;
    let currentDateISO = E2EGlobal.formatDateISO8601(new Date());
    expect(E2EMinutes.getMinutesId(currentDateISO)).to.be.ok;
  });

  it("prohibits two minutes on the same date", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;
    let myDate1 = "2015-03-17"; // date of first project commit ;-)

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
    E2EMinutes.finalizeCurrentMinutes();

    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate1);
    E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(2);
    let currentDateISO = E2EGlobal.formatDateISO8601(new Date());
    expect(E2EMinutes.getMinutesId(currentDateISO)).to.be.ok;
  });

  it("cancel finalize Minutes, when warning-box appears", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(0);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.false;
    E2EMinutes.finalizeCurrentMinutesWithoutParticipants(true, false);

    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.false;
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
  });

  it("process finalize Minutes, when warning-box appears", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(0);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.false;
    E2EMinutes.finalizeCurrentMinutesWithoutParticipants(true, true);

    expect(browser.isExisting("#btn_unfinalizeMinutes")).to.be.true;
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(1);
  });

  it("update detail on pinned and not discussed item in next minute after finalizing item origin minute", function () {
    aMeetingCounter++;
    aMeetingName = aMeetingNameBase + aMeetingCounter;

    E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    expect(
      E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName),
    ).to.equal(0);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    let aTopicName = "Topic";
    let infoItemName = "Info Item";
    E2ETopics.addTopicToMinutes(aTopicName);
    E2ETopics.addInfoItemToTopic(
      {
        subject: infoItemName,
        itemType: "infoItem",
      },
      1,
    );

    let details = "Details";
    E2ETopics.addDetailsToActionItem(1, 1, details);

    E2ETopics.toggleInfoItemStickyState(1, 1);
    E2EMinutes.finalizeCurrentMinutesWithoutParticipants(true, true);

    E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

    let detailsNew = "Updated Details";
    E2ETopics.editDetailsForActionItem(1, 1, 1, detailsNew);

    let itemsOfTopic = E2ETopics.getItemsForTopic(1);
    let item = itemsOfTopic[0].ELEMENT;
    expect(browser.elementIdText(item).value).to.have.string(detailsNew);
  });
});
