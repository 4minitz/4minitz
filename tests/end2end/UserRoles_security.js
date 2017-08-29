import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';

const saveRoleForMeetingSeries = 'userroles.saveRoleForMeetingSeries';
const insertMeetingSeriesMethod = 'meetingseries.insert';
const removeAllRolesForMeetingSeries = 'userroles.removeAllRolesForMeetingSeries';
const newRoleModerator = '01';

let createMeetingSeries = (name) => {
    E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: name, name: name});
    return E2EMeetingSeries.getMeetingSeriesId(name, name);
};

let inviteUserToMeetingSerie = (MSname, role, userIndex) => {
    E2EMeetingSeriesEditor.openMeetingSeriesEditor(MSname, MSname, 'invited');
    let user = E2EGlobal.SETTINGS.e2eTestUsers[userIndex];
    if (role === 'Invited')
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user, E2EGlobal.USERROLES.Invited);
    else
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user, E2EGlobal.USERROLES.Informed);
    E2EMeetingSeriesEditor.closeMeetingSeriesEditor();
};

let tryUpdateRole = (meetingSeriesID, userIndex, newRole, expectToEqual) => {
    const userID = server.call('e2e.getUserId', userIndex);
    E2ESecurity.replaceMethodOnClientSide(saveRoleForMeetingSeries);
    E2ESecurity.executeMethod(saveRoleForMeetingSeries, userID, meetingSeriesID, newRole);
    expect((server.call('e2e.getUserRole', meetingSeriesID, userIndex))).to.equal(expectToEqual);
};

let tryRemoveRole = (meetingSeriesID, userIndex, expectToEqual) => {
    const userID = server.call('e2e.getUserId', userIndex);
    E2ESecurity.replaceMethodOnClientSide(removeAllRolesForMeetingSeries);
    E2ESecurity.executeMethod(removeAllRolesForMeetingSeries, userID, meetingSeriesID);
    expect((server.call('e2e.getUserRole', meetingSeriesID, userIndex))).to.equal(expectToEqual);
};


describe('UserRoles Method Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    //userroles.saveRoleForMeetingSeries
    it('a user can not upgrade himself to a moderator of MS', function () {
        const name = 'Update my own Role Project';
        const meetingSeriesID = createMeetingSeries(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);
        const oldRole = server.call('e2e.getUserRole', meetingSeriesID, 1);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateRole(meetingSeriesID, 1, newRoleModerator, oldRole);
        E2EApp.loginUser();
    });

    it('a moderator can change a role of an invited user in Meeting Series', function () {
        const name = 'Update my own Role Moderator Project';
        const meetingSeriesID = createMeetingSeries(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);

        tryUpdateRole(meetingSeriesID, 1, newRoleModerator, newRoleModerator)
    });

    it('a user can not change a Role of another user in a Meeting Serie', function () {
        const name = 'Update other users Role Project';
        const meetingSeriesID = createMeetingSeries(name);

        inviteUserToMeetingSerie(name, 'Invited', 1);
        const oldRoleUser1 = server.call('e2e.getUserRole', meetingSeriesID, 1);

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateRole(meetingSeriesID, 1, newRoleModerator, oldRoleUser1);
        E2EApp.loginUser();
    });

    it('a user can not add himself to a Meeting Serie', function () {
        const name = 'RoleUpdate add to MS Project';
        const meetingSeriesID = createMeetingSeries(name);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateRole(meetingSeriesID, 1, newRoleModerator, null);
        E2EApp.loginUser();
    });

    //userroles.removeAllRolesForMeetingSeries
    it('a Moderator can delete another user from a Meeting Serie', function () {
        const name = 'RoleDelete Moderator Project';
        const meetingSeriesID = createMeetingSeries(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);

        tryRemoveRole(meetingSeriesID, 1, null);
    });

    it('a user can not delete another user from a Meeting Serie', function () {
        const name = 'RoleDelete invited user Project';
        const meetingSeriesID = createMeetingSeries(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);
        inviteUserToMeetingSerie(name, 'Invited', 2);
        const roleUser1 = server.call('e2e.getUserRole', meetingSeriesID, 1);

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryRemoveRole(meetingSeriesID, 1, roleUser1);
        E2EApp.loginUser();
    });
});

describe('Users Publish & Subscribe Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('Non-logged in users have no users collection published ', function () {
        const minutesUser1 = E2ESecurity.countRecordsInMiniMongo('users');
        expect(E2ESecurity.countRecordsInMiniMongo('users'),
            'Moderator should have users collection published').to.equal(minutesUser1);

        E2EApp.logoutUser();
        expect (E2EApp.isLoggedIn()).to.be.false;
        expect(E2ESecurity.countRecordsInMiniMongo('users'),
            'Not logged in user should not have users collection published').to.equal(0);
        E2EApp.loginUser();
    });
});
