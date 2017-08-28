import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';

const insertMeetingSeriesMethod = 'meetingseries.insert';
const updateMinutes = 'minutes.update';
const addMinutes = 'workflow.addMinutes';
const removeMinute = 'workflow.removeMinute';
const finalizeMinute = 'workflow.finalizeMinute';
const unfinalizeMinute = 'workflow.unfinalizeMinute';
const newMinuteDate = '01.01.2000';

let createMeetingSeriesAndMinute = (name) => {
    E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: name, name: name});
    E2EMinutes.addMinutesToMeetingSeries(name, name);
    E2EMinutes.gotoLatestMinutes();
    return {
        min_id : E2EMinutes.getCurrentMinutesId(),
        date : E2EMinutes.getCurrentMinutesDate(),
    };
};

let tryFinalizeMinute = (minuteID, expectToBeFinalized) => {
    E2ESecurity.replaceMethodOnClientSide(finalizeMinute);
    E2ESecurity.executeMethod(finalizeMinute, minuteID);
    if (expectToBeFinalized)
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.true;
    else
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.false;
};

let createMeetingSeries = (name) => {
    E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: name, name: name});
    return E2EMeetingSeries.getMeetingSeriesId(name, name);
};

let tryUpdateCurrentMinuteDate = (minuteID, newDate, expectToEqualDate) => {
    E2ESecurity.replaceMethodOnClientSide(updateMinutes);
    E2ESecurity.executeMethod(updateMinutes, {_id: minuteID, date: newDate});
    expect((server.call('e2e.findMinute', minuteID)).date).to.equal(expectToEqualDate);
};

let tryAddNewMinute = (meetingSeriesID, date, expectToEqualNumberMinutes, userIdex) => {
    const userid = server.call('e2e.getUserId', userIdex);
    E2ESecurity.replaceMethodOnClientSide(addMinutes);
    E2ESecurity.executeMethod(addMinutes, {meetingSeries_id: meetingSeriesID, date: date, visibleFor:[userid]});
    expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(expectToEqualNumberMinutes);
};

let tryRemoveMinute = (minuteID, expectToEqualNumberMinutes) => {
    E2ESecurity.replaceMethodOnClientSide(removeMinute);
    E2ESecurity.executeMethod(removeMinute, minuteID);
    expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(expectToEqualNumberMinutes);
};

let tryUnfinalizeMinute = (minuteID, expectToBeFinalized) => {
    E2ESecurity.replaceMethodOnClientSide(unfinalizeMinute);
    E2ESecurity.executeMethod(unfinalizeMinute, minuteID);
    if (expectToBeFinalized)
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.true;
    else
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.false;
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

describe('Minutes Method Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });
    before('reload page and reset app', function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    //minute.update
    it('can update a Minute if moderator ', function () {
        const name = 'MinuteUpdate as moderator';
        const min = createMeetingSeriesAndMinute(name);
        tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, newMinuteDate);

    });

    it('can not update a Minute if not logged in ', function () {
        const name = 'MinuteUpdate as not logged in';
        const min = createMeetingSeriesAndMinute(name);
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
        E2EApp.loginUser();

    });

    it('can not update a Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteUpdate as not invited to MS';
        const min = createMeetingSeriesAndMinute(name);
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;

        tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
        E2EApp.loginUser();

    });

    it('can not update a Minute as an invited user ', function () {
        const name = 'MinuteUpdate as Invited';
        const min = createMeetingSeriesAndMinute(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;

        tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
        E2EApp.loginUser();

    });

    //addMinute
    it('can not add a new Minute if not logged in', function () {
        const name = 'MinuteAdd as not logged in';
        const ms_id = createMeetingSeries(name);

        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes, 0);
        E2EApp.loginUser();
    });

    it('can add a new Minute if a moderator', function () {
        const name = 'MinuteAdd as moderator';
        const ms_id = createMeetingSeries(name);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes+1, 0);
    });

    it('can not add a new Minute as an invited user', function () {
        const name = 'MinuteAdd as invited user';
        const ms_id = createMeetingSeries(name);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');
        inviteUserToMeetingSerie(name, 'Invited', 1);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes, 1);
        E2EApp.loginUser();
    });

    it('can not add a new Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteAdd as not invited to MS';
        const ms_id = createMeetingSeries(name);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes, 1);
        E2EApp.loginUser();
    });

    //workflow.removeMinute
    it('can delete a Minute if a moderator', function () {
        const name = 'MinuteDelete as moderator';
        const min = createMeetingSeriesAndMinute(name);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        tryRemoveMinute(min.min_id, numberOfMinutes-1);
    });

    it('can not delete a Minute if not logged in', function () {
        const name = 'MinuteDelete as not logged in';
        const min = createMeetingSeriesAndMinute(name);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        tryRemoveMinute(min.min_id, numberOfMinutes);
        E2EApp.loginUser();
    });

    it('can not delete a Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteDelete as not invited to MS';
        const min = createMeetingSeriesAndMinute(name);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryRemoveMinute(min.min_id, numberOfMinutes)
        E2EApp.loginUser();
    });

    it('can not delete a Minute as an invited user', function () {
        const name = 'MinuteDelete as an invited user';
        const min = createMeetingSeriesAndMinute(name);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');
        inviteUserToMeetingSerie(name, 'Invited', 1);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryRemoveMinute(min.min_id, numberOfMinutes)
        E2EApp.loginUser();
    });

    //workflow.finalizeMinute
    it('can finalize a Minute if Moderator', function () {
        const name = 'MinuteFinalize as moderator';
        const min = createMeetingSeriesAndMinute(name);

        tryFinalizeMinute(min.min_id, true);
    });

    it('can not finalize a Minute if not logged in ', function () {
        const name = 'MinuteFinalize as not logged in';
        const min = createMeetingSeriesAndMinute(name);

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryFinalizeMinute(min.min_id, false);
        E2EApp.loginUser();
    });

    it('can not finalize a Minute if not invited to a Meeting Serie ', function () {
        const name = 'MinuteFinalize as not invited to MS';
        const min = createMeetingSeriesAndMinute(name);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryFinalizeMinute(min.min_id, false);
        E2EApp.loginUser();
    });

    it('can not finalize a Minute as an invited user ', function () {
        const name = 'MinuteFinalize as an invited user';
        const min = createMeetingSeriesAndMinute(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryFinalizeMinute(min.min_id, false);
        E2EApp.loginUser();
    });

    //workflow.unfinalizeMinute
    it('can unfinalize a Minute if Moderator ', function () {
        const name = 'MinuteUnfinalize as moderator';
        const min = createMeetingSeriesAndMinute(name);

        E2ESecurity.executeMethod(finalizeMinute, min.min_id);
        tryUnfinalizeMinute(min.min_id, false);
    });

    it('can not unfinalize a Minute if not logged in ', function () {
        const name = 'MinuteUnfinalize as not logged in';
        const min = createMeetingSeriesAndMinute(name);

        E2ESecurity.executeMethod(finalizeMinute, min.min_id);
        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        tryUnfinalizeMinute(min.min_id, true);
        E2EApp.loginUser();
    });

    it('can not unfinalize a Minute if not invited to a Meeting Serie ', function () {
        const name = 'MinuteUnfinalize as not invited to MS';
        const min = createMeetingSeriesAndMinute(name);

        E2ESecurity.executeMethod(finalizeMinute, min.min_id);
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUnfinalizeMinute(min.min_id, true);
        E2EApp.loginUser();
    });

    it('can not unfinalize a Minute as an invited user ', function () {
        const name = 'MinuteUnfinalize as an invited user';
        const min = createMeetingSeriesAndMinute(name);

        inviteUserToMeetingSerie(name, 'Invited', 1);
        E2ESecurity.executeMethod(finalizeMinute, min.min_id);

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        tryUnfinalizeMinute(min.min_id, true);
        E2EApp.loginUser();
    });

    it('can not unfinalize a Minute as a Moderator if it is not the last one ', function () {
        const name = 'MinuteUnfinalize for not last Minute';
        const minute_1 = createMeetingSeriesAndMinute(name);

        E2ESecurity.executeMethod(finalizeMinute, minute_1.min_id);
        E2EMinutes.addMinutesToMeetingSeries(name, name);
        E2EMinutes.gotoLatestMinutes();
        const minuteID_2 =  E2EMinutes.getCurrentMinutesId();
        E2ESecurity.executeMethod(finalizeMinute, minuteID_2);

        tryUnfinalizeMinute(minute_1.min_id, true);
    });

});

describe('Minute Publish & Subscribe Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('Non-logged in users have no unexpected Minutes published ', function () {
        const minutesUser1 = E2ESecurity.countRecordsInMiniMongo('minutes');
        const name = 'Publish Minutes Project #1';
        const min = createMeetingSeriesAndMinute(name);
        tryFinalizeMinute(min.min_id, true);

        E2EMinutes.addMinutesToMeetingSeries(name, name);

        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Moderator should have 2 Minutes published').to.equal(minutesUser1+2);

        E2EApp.logoutUser();
        expect (E2EApp.isLoggedIn()).to.be.false;
        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Not logged in user should not have Minutes published').to.equal(0);

        E2EApp.loginUser();
    });

    it('Invited users should have Minutes published ', function () {
        E2EApp.loginUser(1);
        expect (E2EApp.isLoggedIn()).to.be.true;
        const minutesUser2 = E2ESecurity.countRecordsInMiniMongo('minutes');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        const name = 'Publish Minutes Project #2';

        const min = createMeetingSeriesAndMinute(name);
        inviteUserToMeetingSerie(name, 'Invited', 1);
        tryFinalizeMinute(min.min_id, true);

        E2EMinutes.addMinutesToMeetingSeries(name, name);

        E2EApp.loginUser(1);
        expect (E2EApp.isLoggedIn()).to.be.true;
        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Invited user should have 2 Minutes published').to.equal(minutesUser2+2);

        E2EApp.loginUser();
    });

    it('Informed users should have no unexpected Minutes published ', function () {
        E2EApp.loginUser(2);
        expect (E2EApp.isLoggedIn()).to.be.true;
        const minutesUser3 = E2ESecurity.countRecordsInMiniMongo('minutes');

        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
        const name = 'Publish Minutes Project #3';

        const min = createMeetingSeriesAndMinute(name);
        inviteUserToMeetingSerie(name, 'Informed', 2);
        tryFinalizeMinute(min.min_id, true);

        E2EMinutes.addMinutesToMeetingSeries(name, name);

        E2EApp.loginUser(2);
        expect (E2EApp.isLoggedIn()).to.be.true;
        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Informed user should not have Minutes published').to.equal(minutesUser3);

        E2EApp.loginUser();
    });

});
