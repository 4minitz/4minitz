import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EUser } from './helpers/E2EUser'
import { E2ESecurity } from './helpers/E2ESecurity'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'



describe('UserRoles Security', function () {
    const saveRoleForMeetingSeries = 'userroles.saveRoleForMeetingSeries';
    const insertMeetingSeriesMethod = 'meetingseries.insert';
    const removeAllRolesForMeetingSeries = 'userroles.removeAllRolesForMeetingSeries';

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    //userroles.saveRoleForMeetingSeries
    it('a user can not upgrade himself to a moderator of MS', function () {
        const aProjectName = 'Update my own Role Project';
        const aMeetingName = 'Update my own Role Meeting';
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save
        const userRole = server.call('e2e.getUserRole', meetingSeriesID, 1);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(saveRoleForMeetingSeries);
        E2ESecurity.executeMethod(saveRoleForMeetingSeries, E2EApp.getCurrentUser(), meetingSeriesID, '01');
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(userRole);
    });

    it('a moderator can change a role of an invited user in Meeting Series', function () {
        const aProjectName = 'Update my own Role Moderator Project';
        const aMeetingName = 'Update my own Role Moderator Meeting';
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        const user2_Id = server.call('e2e.getUserId', 1);
        E2ESecurity.executeMethod(saveRoleForMeetingSeries, user2_Id, meetingSeriesID, '10');
        const userRole = server.call('e2e.getUserRole', meetingSeriesID, 1);
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(userRole);

        const userRole_new = '01';
        E2ESecurity.replaceMethodOnClientSide(saveRoleForMeetingSeries);

        E2ESecurity.executeMethod(saveRoleForMeetingSeries, user2_Id, meetingSeriesID, userRole_new);
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(userRole_new);
    });

    it('a user can not change a Role of another user in a Meeting Serie', function () {
        const aProjectName = 'Update other users Role Project';
        const aMeetingName = 'Update other users Role Meeting';
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save
        const userRole_old = server.call('e2e.getUserRole', meetingSeriesID, 1);
        const user2_Id = server.call('e2e.getUserId', 1);
        const userRole_new = '01';

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(userRole_old);

        E2ESecurity.replaceMethodOnClientSide(saveRoleForMeetingSeries);
        E2ESecurity.executeMethod(saveRoleForMeetingSeries, user2_Id, meetingSeriesID, userRole_new);
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(userRole_old);

    });

    it('a user can not add himself to a Meeting Serie', function () {
        const aProjectName = 'RoleUpdate add to MS Project';
        const aMeetingName = 'RoleUpdate add to MS Meeting';
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        const userRole = '10';

        E2ESecurity.replaceMethodOnClientSide(saveRoleForMeetingSeries);
        E2ESecurity.executeMethod(saveRoleForMeetingSeries, E2EApp.getCurrentUser(), meetingSeriesID, userRole);
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(null);
    });

    //userroles.removeAllRolesForMeetingSeries
    it('a Moderator can delete another user from a Meeting Serie', function () {
        const aProjectName = 'RoleDelete Moderator Project';
        const aMeetingName = 'RoleDelete Moderator Meeting';
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save
        const user2_Id = server.call('e2e.getUserId', 1);

        E2ESecurity.replaceMethodOnClientSide(removeAllRolesForMeetingSeries);
        E2ESecurity.executeMethod(removeAllRolesForMeetingSeries, user2_Id, meetingSeriesID);
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(null);

    });

    it('a user can not delete another user from a Meeting Serie', function () {
        const aProjectName = 'RoleDelete invited user Project';
        const aMeetingName = 'RoleDelete invited user Meeting';
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save
        const user2_Id = server.call('e2e.getUserId', 1);
        const userRole = server.call('e2e.getUserRole', meetingSeriesID, 1);

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        E2ESecurity.replaceMethodOnClientSide(removeAllRolesForMeetingSeries);

        E2ESecurity.executeMethod(removeAllRolesForMeetingSeries, user2_Id, meetingSeriesID);
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(userRole);

    });


    it('Non-logged in users have no users collection published ', function () {
        const minutesUser1 = E2ESecurity.countRecordsInMiniMongo('users');
        expect(E2ESecurity.countRecordsInMiniMongo('users'),
            'Moderator should have users collection published').to.equal(minutesUser1);

        E2EApp.logoutUser();
        expect (E2EApp.isLoggedIn()).to.be.false;
        expect(E2ESecurity.countRecordsInMiniMongo('users'),
            'Not logged in user should not have users collection published').to.equal(0);
    });

    });
