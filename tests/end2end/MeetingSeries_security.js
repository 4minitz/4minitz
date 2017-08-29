import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';

const insertMeetingSeriesMethod = 'meetingseries.insert';
const removeMeetingSeriesMethod = 'workflow.removeMeetingSeries';
const updateMeetingSeriesMethod ='meetingseries.update';
const newName = 'Changed Hacker Project #3';

let tryInsertMeetingSeries = (name, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(insertMeetingSeriesMethod);
    E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: name, name: name});
    expect(server.call('e2e.countMeetingSeriesInMongDB'), testName).to.equal(expectToEqual);
};

let createMeetingSeries = (name) => {
    E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: name, name: name});
    return E2EMeetingSeries.getMeetingSeriesId(name, name);
};

let tryDeleteMeetingSeries = (meetingSeriesID, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(removeMeetingSeriesMethod);
    E2ESecurity.executeMethod(removeMeetingSeriesMethod, meetingSeriesID);
    expect(server.call('e2e.countMeetingSeriesInMongDB'), testName).to.equal(expectToEqual);
};

let tryUpdateMeetingSeriesName = (meetingSeriesID, newName, expectToEqual, testName) => {
    E2ESecurity.replaceMethodOnClientSide(updateMeetingSeriesMethod);
    E2ESecurity.executeMethod(updateMeetingSeriesMethod, {_id: meetingSeriesID, name: newName});
    expect((server.call('e2e.findMeetingSeries', meetingSeriesID)).name, testName).to.equal(expectToEqual);
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

describe('MeetingSeries Methods Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('can not insert a new MeetingSerie if not logged in', function () {
        const name = 'Insert a MeetingSerie';
        const meetingSeriesCount = server.call('e2e.countMeetingSeriesInMongDB');
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryInsertMeetingSeries(name, meetingSeriesCount, 'Meeting Series can not be added if user is not logged in');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryInsertMeetingSeries(name, meetingSeriesCount+1, 'Meeting Series can be added if user is logged in');
    });

    it('can not delete a new MeetingSerie if not logged in', function () {
        const name = 'DeleteMeetingSerie';
        const ms_id = createMeetingSeries(name);
        const meetingSeriesCount = server.call('e2e.countMeetingSeriesInMongDB');

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryDeleteMeetingSeries(ms_id, meetingSeriesCount, 'Meeting Series can not be deleted if user is not logged in');

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryDeleteMeetingSeries(ms_id, meetingSeriesCount, 'Meeting Series can not be deleted if user is not a moderator');

        E2EApp.loginUser(0);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryDeleteMeetingSeries(ms_id, meetingSeriesCount-1, 'Meeting Series can be deleted if user is moderator');
    });

    it('can not update a MeetingSerie if not logged in', function () {
        const name = 'UpdateMeetingSerie';
        const ms_id = createMeetingSeries(name);
        const oldName = (server.call('e2e.findMeetingSeries', ms_id)).name;

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryUpdateMeetingSeriesName(ms_id, newName, oldName, 'Meeting Series can not be updated if user is not logged in');

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateMeetingSeriesName(ms_id, newName, oldName, 'Meeting Series can not be updated if user is not a moderator');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUpdateMeetingSeriesName(ms_id, newName, newName, 'Meeting Series can be updated if user is logged in and a moderator');
    });
});

describe('MeetingSeries Publish & Subscribe Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('Non-logged in users have no unexpected MS published ', function () {
        const msUser1 = E2ESecurity.countRecordsInMiniMongo('meetingSeries');
        const name = 'Publish MS Project #1';
        createMeetingSeries(name);

        expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Moderator should have a MS published').to.equal(msUser1+1);

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Not logged in user should not have a MS published').to.equal(0);
        E2EApp.loginUser();
    });

    it('Invited users have no unexpected MS published ', function () {
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        const msUser2 = E2ESecurity.countRecordsInMiniMongo('meetingSeries');

        E2EApp.loginUser();
        const name = 'Publish MS Project #2';
        createMeetingSeries(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Invited user should have a MS published').to.equal(msUser2+1);
        E2EApp.loginUser();
    });

    it('Informed users have no unexpected MS published ', function () {
        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        const msUser3 = E2ESecurity.countRecordsInMiniMongo('meetingSeries');

        E2EApp.loginUser();
        const name = 'Publish MS Project #3';
        createMeetingSeries(name);
        inviteUserToMeetingSerie(name, 'Informed', 2);

        E2EApp.loginUser(2);
        expect(E2EApp.isLoggedIn()).to.be.true;
        expect(E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Informed user should not have a MS published').to.equal(msUser3);
        E2EApp.loginUser();
    });
});
