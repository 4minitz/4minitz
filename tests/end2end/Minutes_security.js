import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2ESecurity } from './helpers/E2ESecurity'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'


describe('MeetingSeries Security', function () {
    const insertMeetingSeriesMethod = "meetingseries.insert";
    const updateMinutes = "minutes.update";
    const addMinutes = "workflow.addMinutes";
    const removeMinute = "workflow.removeMinute";
    const finalizeMinute = "workflow.finalizeMinute";
    const unfinalizeMinute = "workflow.unfinalizeMinute";

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    //minute.update
    it('can update a Minute if moderator', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteUpdate as moderator";
        const aMeetingName = "MinuteUpdate as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const newMinuteDate = '01.01.2000';

        E2ESecurity.replaceMethodOnClientSide(updateMinutes);
        E2ESecurity.executeMethod(updateMinutes, {_id: minuteID, date: newMinuteDate});
        expect((server.call('e2e.findMinute', minuteID)).date).to.equal(newMinuteDate);
    });

    it('can not update a Minute if not logged in', function () {
        const aProjectName = "MinuteUpdate as not logged in";
        const aMeetingName = "MinuteUpdate as not logged in";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const minuteDate = E2EMinutes.getCurrentMinutesDate();
        const newMinuteDate = '01.01.2000';

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.replaceMethodOnClientSide(updateMinutes);
        E2ESecurity.executeMethod(updateMinutes, {_id: minuteID, date: newMinuteDate});
        expect((server.call('e2e.findMinute', minuteID)).date).to.equal(minuteDate);
        E2EApp.loginUser();
    });

    it('can not update a Minute if not invited to a Meeting Serie', function () {
        const aProjectName = "MinuteUpdate as not invited to MS";
        const aMeetingName = "MinuteUpdate as not invited to MS";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const minuteDate = E2EMinutes.getCurrentMinutesDate();
        const newMinuteDate = '01.01.2000';

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.replaceMethodOnClientSide(updateMinutes);
        E2ESecurity.executeMethod(updateMinutes, {_id: minuteID, date: newMinuteDate});
        expect((server.call('e2e.findMinute', minuteID)).date).to.equal(minuteDate);
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    it('can not update a Minute as an invited user', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteUpdate as Invited";
        const aMeetingName = "MinuteUpdate as Invited";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const minuteDate = E2EMinutes.getCurrentMinutesDate();
        const newMinuteDate = '01.01.2000';

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
        E2ESecurity.replaceMethodOnClientSide(updateMinutes);
        E2ESecurity.executeMethod(updateMinutes, {_id: minuteID, date: newMinuteDate});
        expect((server.call('e2e.findMinute', minuteID)).date).to.equal(minuteDate);
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    //addMinute
    it('can not add a new Minute if not logged in', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteAdd as not logged in";
        const aMeetingName = "MinuteAdd as not logged in";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');
        const userid = server.call('e2e.getUserId', 0);
        const date = '29.07.2017';

        E2EApp.logoutUser();
        expect(E2EApp.isLoggedIn()).to.be.false;
        E2ESecurity.replaceMethodOnClientSide(addMinutes);
        E2ESecurity.executeMethod(addMinutes, {meetingSeries_id: meetingSeriesID, date: date, visibleFor:[userid]});
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
        E2EApp.loginUser();
    });

    it('can add a new Minute if a moderator', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteAdd as moderator";
        const aMeetingName = "MinuteAdd as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');
        const userid = server.call('e2e.getUserId', 0);
        const date = '2017-07-29';

        E2ESecurity.replaceMethodOnClientSide(addMinutes);
        E2ESecurity.executeMethod(addMinutes, {meetingSeries_id: meetingSeriesID, date: date, visibleFor:[userid]});
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes+1);
    });

    it('can not add a new Minute as an invited user ', function () {
        const aProjectName = "MinuteAdd as invited user";
        const aMeetingName = "MinuteAdd as invited user";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');
        const userid = server.call('e2e.getUserId', 1);
        const date = '2017-07-29';

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(addMinutes);
        E2ESecurity.executeMethod(addMinutes, {meetingSeries_id: meetingSeriesID, date: date, visibleFor:[userid]});
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    it('can not add a new Minute if not invited to a Meeting Serie', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteAdd as not invited to MS";
        const aMeetingName = "MinuteAdd as not invited to MS";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        const meetingSeriesID = E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName);
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');
        const userid = server.call('e2e.getUserId', 1);
        const date = '2017-07-29';

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(addMinutes);
        E2ESecurity.executeMethod(addMinutes, {meetingSeries_id: meetingSeriesID, date: date, visibleFor:[userid]});
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    //workflow.removeMinute
    it('can delete a Minute if a moderator', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteDelete as moderator";
        const aMeetingName = "MinuteDelete as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2ESecurity.replaceMethodOnClientSide(removeMinute);
        E2ESecurity.executeMethod(removeMinute, minuteID);
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes-1);
    });

    it('can not delete a Minute if not logged in', function () {
        const aProjectName = "MinuteDelete as not logged in";
        const aMeetingName = "MinuteDelete as not logged in";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(removeMinute);
        E2ESecurity.executeMethod(removeMinute, minuteID);
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
        E2EApp.loginUser();
    });

    it('can not delete a Minute if not invited to a Meeting Serie', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteDelete as not invited to MS";
        const aMeetingName = "MinuteDelete as not invited to MS";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(removeMinute);
        E2ESecurity.executeMethod(removeMinute, minuteID);
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    it('can not delete a Minute as an invited user', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteDelete as an invited user";
        const aMeetingName = "MinuteDelete as as an invited user";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(removeMinute);
        E2ESecurity.executeMethod(removeMinute, minuteID);
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    //workflow.finalizeMinute
    it('can finalize a Minute if Moderator ', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteFinalize as moderator";
        const aMeetingName = "MinuteFinalize as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();

        E2ESecurity.replaceMethodOnClientSide(finalizeMinute);
        E2ESecurity.executeMethod(finalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.true;

    });

    it('can not finalize a Minute if not logged in ', function () {
        const aProjectName = "MinuteFinalize as not logged in";
        const aMeetingName = "MinuteFinalize as not logged in";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(finalizeMinute);
        E2ESecurity.executeMethod(finalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.false;
        E2EApp.loginUser();
    });

    it('can not finalize a Minute if not invited to a Meeting Serie', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteFinalize as not invited to MS";
        const aMeetingName = "MinuteFinalize as not invited to MS";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(finalizeMinute);
        E2ESecurity.executeMethod(finalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.false;
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    it('can not finalize a Minute as an invited user', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteFinalize as an invited user";
        const aMeetingName = "MinuteFinalize as an invited user";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(finalizeMinute);
        E2ESecurity.executeMethod(finalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.false;
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    //workflow.unfinalizeMinute
    it('can unfinalize a Minute if Moderator ', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteUnfinalize as moderator";
        const aMeetingName = "MinuteUnfinalize as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();

        E2ESecurity.executeMethod(finalizeMinute, minuteID);
        E2ESecurity.replaceMethodOnClientSide(unfinalizeMinute);
        E2ESecurity.executeMethod(unfinalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.false;

    });

    it('can not unfinalize a Minute if not logged in ', function () {
        const aProjectName = "MinuteUnfinalize as not logged in";
        const aMeetingName = "MinuteUnfinalize as not logged in";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        E2ESecurity.executeMethod(finalizeMinute, minuteID);

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(unfinalizeMinute);
        E2ESecurity.executeMethod(unfinalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.true;
        E2EApp.loginUser();
    });

    it('can not unfinalize a Minute if not invited to a Meeting Serie ', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteUnfinalize as not invited to MS";
        const aMeetingName = "MinuteUnfinalize as not invited to MS";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        E2ESecurity.executeMethod(finalizeMinute, minuteID);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(unfinalizeMinute);
        E2ESecurity.executeMethod(unfinalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.true;
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    it('can not unfinalize a Minute as an invited user ', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteUnfinalize as an invited user";
        const aMeetingName = "MinuteUnfinalize as an invited user";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        E2ESecurity.executeMethod(finalizeMinute, minuteID);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(unfinalizeMinute);
        E2ESecurity.executeMethod(unfinalizeMinute, minuteID);
        expect((server.call('e2e.findMinute', minuteID)).isFinalized).to.be.true;
        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    it('can not unfinalize a Minute as a Moderator if it is not the last one ', function () {
        expect(E2EApp.isLoggedIn()).to.be.true;
        const aProjectName = "MinuteUnfinalize for not last Minute";
        const aMeetingName = "MinuteUnfinalize for not last Minute";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID_1 =  E2EMinutes.getCurrentMinutesId();
        E2ESecurity.executeMethod(finalizeMinute, minuteID_1);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.gotoLatestMinutes();
        const minuteID_2 =  E2EMinutes.getCurrentMinutesId();

        E2ESecurity.executeMethod(finalizeMinute, minuteID_2);
        E2ESecurity.replaceMethodOnClientSide(unfinalizeMinute);
        E2ESecurity.executeMethod(unfinalizeMinute, minuteID_1);
        expect((server.call('e2e.findMinute', minuteID_1)).isFinalized).to.be.true;

    });

    it('Non-logged in users have no unexpected Minutes published ', function () {
        const minutesUser1 = E2ESecurity.countRecordsInMiniMongo('minutes');

        const aProjectName = "Publish Minutes Project #1";
        const aMeetingName = "Publish Minutes Meeting #1";

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Moderator should have 2 Minutes published').to.equal(minutesUser1+2);

        E2EApp.logoutUser();
        expect (E2EApp.isLoggedIn()).to.be.false;
        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Not logged in user should not have Minutes published').to.equal(0);
    });



    it('Invited users should have Minutes published ', function () {
        E2EApp.loginUser(1);
        expect (E2EApp.isLoggedIn()).to.be.true;
        const minutesUser2 = E2ESecurity.countRecordsInMiniMongo('minutes');

        E2EApp.logoutUser();
        E2EApp.loginUser();
        const aProjectName = "Publish Minutes Project #2";
        const aMeetingName = "Publish Minutes Meeting #2";

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        const user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        expect (E2EApp.isLoggedIn()).to.be.true;
        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Invited user should have 2 Minutes published').to.equal(minutesUser2+2);

        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    it('Informed users should have no unexpected Minutes published @watch', function () {
        E2EApp.loginUser(2);
        expect (E2EApp.isLoggedIn()).to.be.true;
        const minutesUser3 = E2ESecurity.countRecordsInMiniMongo('minutes');

        E2EApp.logoutUser();
        E2EApp.loginUser();
        const aProjectName = "Publish Minutes Project #3";
        const aMeetingName = "Publish Minutes Meeting #3";

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        const user3 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Informed);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        E2EApp.logoutUser();
        E2EApp.loginUser(2);
        expect (E2EApp.isLoggedIn()).to.be.true;
        expect(E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Informed user should not have Minutes published').to.equal(minutesUser3);

        E2EApp.logoutUser();
        E2EApp.loginUser();
    });

    });
