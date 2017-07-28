import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EUser } from './helpers/E2EUser'
import { E2ESecurity } from './helpers/E2ESecurity'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'



describe('UserRoles Security', function () {
    const saveRoleForMeetingSeries = "userroles.saveRoleForMeetingSeries";
    const insertMeetingSeriesMethod = "meetingseries.insert";

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });


    it('a user can not upgrade himself to a moderator of MS', function () {
        const aProjectName = "RoleUpdate Project";
        const aMeetingName = "RoleUpdate Meeting";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save
        let userRole = server.call('e2e.getUserRole', meetingSeriesID, 1);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.executeMethod(saveRoleForMeetingSeries, {otherUserId: E2EApp.getCurrentUser(), meetingSeriesId: meetingSeriesID, newRole: '01'});
        expect((server.call('e2e.getUserRole', meetingSeriesID, 1))).to.equal(userRole);

    });

    });
