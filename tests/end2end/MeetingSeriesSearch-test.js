import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';


describe('MeetingSeriesSearch', function () {
    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect (E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('can create four meeting series and is not able to search @watch', function () {
		 const initialCount = E2EMeetingSeries.countMeetingSeries();
		 for(var i = 1; i <= 4; i++){
			  const aProjectName = "E2E Project" + i;
			  const aMeetingName = "Meeting Name #" + i;
			  E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
		  }
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(4);
		  expect(E2EMeetingSeries.visibleMeetingSeriesSearch()).to.be.false;
    });

	 it('can create the fith meeting series and now is able to search @watch', function () {
		const initialCount = E2EMeetingSeries.countMeetingSeries();
		const aProjectName = "E2E Project5";
		const aMeetingName = "Meeting Name #5";
		E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
		expect(E2EMeetingSeries.countMeetingSeries()).to.equal(5);
		expect(E2EMeetingSeries.visibleMeetingSeriesSearch()).to.be.true;
	 });

	 it('can search for name @watch', function () {
		  E2EMeetingSeries.searchMeetingSeries('#3');
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(1).to.be.ok;
    });

	 it('can search for project @watch', function () {
		  E2EMeetingSeries.searchMeetingSeries('Project3');
		  expect(E2EMeetingSeries.countMeetingSeries()).to.equal(1).to.be.ok;
	  });

	  it('can search with many parameters @watch', function () {
 		  E2EMeetingSeries.searchMeetingSeries('#1 Project3 5');
 		  expect(E2EMeetingSeries.countMeetingSeries()).to.equal(3).to.be.ok;
 	  });

	  it('can notice if nothing is found @watch', function () {
 		  E2EMeetingSeries.searchMeetingSeries('Project99');
 		  expect(E2EMeetingSeries.visibleWarning()).to.be.true;
 	  });
});
