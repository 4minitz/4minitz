import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2ESecurity } from './helpers/E2ESecurity'

describe('MeetingSeries Security', function () {
    beforeEach("goto start page and make sure test user is logged out", function () {
        E2EApp.gotoStartPage();
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('can not insert a new MeetingSerie if not logged in @watch', function (done) {
		const methodName = 'meetingseries.insert';
		
		expect(E2EApp.isLoggedIn()).to.be.false;

        const aProjectName = "Hacker Project";
        const aMeetingName = "Hacker Meeting #1";

		E2ESecurity.expectMethodToExist(methodName);
		E2ESecurity.replaceMethodOnClientSide(methodName);
		
		let noOfMeetingSeries = server.call('e2e.countMeetingSeriesInMongDB');
		
		E2ESecurity.callMethodWithCallback(true, "meetingseries.insert", {project: aProjectName, name: aMeetingName});
		expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(noOfMeetingSeries);
		
		
		E2EApp.loginUser();
		E2ESecurity.callMethodWithCallback(false, "meetingseries.insert", {project: aProjectName, name: aMeetingName});
		expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(noOfMeetingSeries + 1);
    });
});
