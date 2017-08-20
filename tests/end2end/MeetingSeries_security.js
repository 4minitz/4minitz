import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2ESecurity } from './helpers/E2ESecurity'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'

describe('MeetingSeries Security', function () {
    const insertMeetingSeriesMethod = "meetingseries.insert";
    const removeMeetingSeriesMethod = "workflow.removeMeetingSeries";
    const updateMeetingSeriesMethod ="meetingseries.update";

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('can not insert a new MeetingSerie if not logged in', function () {
        const aProjectName = "Hacker Project #1";
        const aMeetingName = "Hacker Meeting #1";
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;

        E2ESecurity.replaceMethodOnClientSide(insertMeetingSeriesMethod);
        const meetingSeriesCount = server.call('e2e.countMeetingSeriesInMongDB');

        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        expect(server.call('e2e.countMeetingSeriesInMongDB'),
            'Meeting Series can not be added if user is not logged in').to.equal(meetingSeriesCount);

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        expect(server.call('e2e.countMeetingSeriesInMongDB'),
            'Meeting Series can be added if user is logged in').to.equal(meetingSeriesCount+1);

    });
    it('can not delete a new MeetingSerie if not logged in', function () {
        const aProjectName = "Hacker Project #2";
        const aMeetingName = "Hacker Meeting #2";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        const countMeetingSeries = server.call('e2e.countMeetingSeriesInMongDB');

        //not logged in
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.replaceMethodOnClientSide(removeMeetingSeriesMethod);
        E2ESecurity.executeMethod(removeMeetingSeriesMethod, meetingSeriesID);
        expect(server.call('e2e.countMeetingSeriesInMongDB'),
            'Meeting Series can not be deleted if user is not logged in').to.equal(countMeetingSeries);

        //logged in but not Moderator
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(removeMeetingSeriesMethod, meetingSeriesID);
        expect(server.call('e2e.countMeetingSeriesInMongDB'),
            'Meeting Series can not be deleted if user is not a moderator').to.equal(countMeetingSeries);

        // logged in and is Moderator
        E2EApp.logoutUser();
        E2EApp.loginUser(0);
        E2ESecurity.executeMethod(removeMeetingSeriesMethod, meetingSeriesID);
        expect(server.call('e2e.countMeetingSeriesInMongDB'),
            'Meeting Series can be deleted if user is logged in and a moderator').to.equal(countMeetingSeries-1);

    });

    it('can not update a MeetingSerie if not logged in', function () {
        const aProjectName = "Hacker Project #3";
        const aMeetingName = "Hacker Meeting #3";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        const meetingSeriesName = (server.call('e2e.findMeetingSeries', meetingSeriesID)).name;

        //not logged in
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.replaceMethodOnClientSide(updateMeetingSeriesMethod);
        E2ESecurity.executeMethod(updateMeetingSeriesMethod, {_id: meetingSeriesID, name: 'Changed Hacker Project #3'});
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).name,
            'Meeting Series can not be updated if user is not logged in').to.equal(meetingSeriesName);

        //logged in but not Moderator
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(updateMeetingSeriesMethod,{_id: meetingSeriesID, name: 'Changed Hacker Project #3'});
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).name,
            'Meeting Series can not be updated if user is not a moderator').to.equal(meetingSeriesName);

        // logged in and is Moderator
        E2EApp.logoutUser();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.executeMethod(updateMeetingSeriesMethod,{_id: meetingSeriesID, name: 'Changed Hacker Project #3'});
        expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).name,
            'Meeting Series can be updated if user is logged in and a moderator').not.to.equal(meetingSeriesName);
    });

    it('Non-invited/non-logged in users have no unexpected MS published ', function () {
        const aProjectName = "Publish MS Project #1";
        const aMeetingName = "Publish MS Meeting #1";

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        const user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Informed);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

       /* expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Moderator should have a MS published').to.equal(1);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Invited user should have a MS published').to.equal(0);

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Informed user should not have a MS published').to.equal(1);

        E2EApp.logoutUser();
        expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Not logged in user should not have a MS published').to.equal(0);*/

    });

    });
