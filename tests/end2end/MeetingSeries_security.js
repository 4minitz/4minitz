import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2ESecurity } from './helpers/E2ESecurity'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'

describe('MeetingSeries Security', function () {
    const insertMeetingSeriesMethod = "meetingseries.insert";
    const removeMeetingSeriesMethod = "workflow.removeMeetingSeries";
    const updateMeetingSeriesMethod ="meetingseries.update";

    beforeEach("goto start page and make sure test user is logged out", function () {
        E2EApp.gotoStartPage();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('can not insert a new MeetingSerie if not logged in', function () {
        let aProjectName = "Hacker Project #1";
        let aMeetingName = "Hacker Meeting #1";
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;

        E2ESecurity.expectMethodToExist(insertMeetingSeriesMethod);
        E2ESecurity.replaceMethodOnClientSide(insertMeetingSeriesMethod);
        
        let noOfMeetingSeries = server.call('e2e.countMeetingSeriesInMongDB');

        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(noOfMeetingSeries);

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(noOfMeetingSeries+1);

    });
    it('can not delete a new MeetingSerie if not logged in', function () {
        let aProjectName = "Hacker Project #2";
        let aMeetingName = "Hacker Meeting #2";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        let meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        let countMeetingSeries = server.call('e2e.countMeetingSeriesInMongDB');

        //not logged in
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.expectMethodToExist(removeMeetingSeriesMethod);
        E2ESecurity.replaceMethodOnClientSide(removeMeetingSeriesMethod);
        E2ESecurity.executeMethod(removeMeetingSeriesMethod, meetingSeriesID);
        expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(countMeetingSeries);

        //logged in but not Moderator
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(removeMeetingSeriesMethod, meetingSeriesID);
        expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(countMeetingSeries);

        // logged in and is Moderator
        E2EApp.logoutUser();
        E2EApp.loginUser(0);
        E2ESecurity.executeMethod(removeMeetingSeriesMethod, meetingSeriesID);
        expect(server.call('e2e.countMeetingSeriesInMongDB')).to.equal(countMeetingSeries-1);

    });

    it('can not update a MeetingSerie if not logged in', function () {
        let aProjectName = "Hacker Project #3";
        let aMeetingName = "Hacker Meeting #3";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        let meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        let meetingSeriesName = (server.call('e2e.findMeetingSeries', meetingSeriesID)).name;

        //not logged in
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.expectMethodToExist(updateMeetingSeriesMethod);
        E2ESecurity.replaceMethodOnClientSide(updateMeetingSeriesMethod);
        E2ESecurity.executeMethod(updateMeetingSeriesMethod, {_id: meetingSeriesID, name: 'Changed Hacker Project #3'});
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).name).to.equal(meetingSeriesName);

        //logged in but not Moderator
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(updateMeetingSeriesMethod,{_id: meetingSeriesID, name: 'Changed Hacker Project #3'});
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).name).to.equal(meetingSeriesName);

        // logged in and is Moderator
        E2EApp.logoutUser();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(updateMeetingSeriesMethod,{_id: meetingSeriesID, name: 'Changed Hacker Project #3'});
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).name).not.to.equal(meetingSeriesName);
    });

    });
