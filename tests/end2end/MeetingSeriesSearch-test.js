import { E2EApp } from "./helpers/E2EApp";
import { E2EMeetingSeries } from "./helpers/E2EMeetingSeries";
import { E2EGlobal } from "./helpers/E2EGlobal";

describe("MeetingSeriesSearch", () => {
  beforeEach("goto start page and make sure test user is logged in", () => {
    E2EApp.gotoStartPage();
    expect(E2EApp.isLoggedIn()).to.be.true;
  });

  before("reload page and reset app", () => {
    E2EGlobal.logTimestamp("Start test suite");
    E2EApp.resetMyApp(true);
    E2EApp.launchApp();
  });

  const bootstrapSeries = (count = 5) => {
    const initialCount = E2EMeetingSeries.countMeetingSeries();
    if (initialCount !== count) {
      const startIndex = initialCount + 1;
      for (let i = startIndex; i <= count; i++) {
        const aProjectName = `E2E Project${i}`;
        const aMeetingName = `Meeting Name #${i}`;
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
      }
    }
  };

  it("can create four meeting series and is not able to search", () => {
    bootstrapSeries(4);
    expect(E2EMeetingSeries.countMeetingSeries()).to.equal(4);
    expect(E2EMeetingSeries.visibleMeetingSeriesSearch()).to.be.false;
  });

  it("can create the fith meeting series and now is able to search", () => {
    bootstrapSeries();
    expect(E2EMeetingSeries.countMeetingSeries()).to.equal(5);
    expect(E2EMeetingSeries.visibleMeetingSeriesSearch()).to.be.true;
  });

  it("can search for name", () => {
    bootstrapSeries();
    E2EMeetingSeries.searchMeetingSeries("#3");
    expect(E2EMeetingSeries.countMeetingSeries(false)).to.equal(1);
  });

  it("can search for project", () => {
    bootstrapSeries();
    E2EMeetingSeries.searchMeetingSeries("Project3");
    expect(E2EMeetingSeries.countMeetingSeries(false)).to.equal(1);
  });

  it("can search with many parameters", () => {
    bootstrapSeries();
    E2EMeetingSeries.searchMeetingSeries("#1 Project3 5");
    expect(E2EMeetingSeries.countMeetingSeries(false)).to.equal(0);
  });

  it("can notice if nothing is found", () => {
    bootstrapSeries();
    E2EMeetingSeries.searchMeetingSeries("Project99");
    expect(E2EMeetingSeries.visibleWarning(false)).to.be.true;
  });
});
