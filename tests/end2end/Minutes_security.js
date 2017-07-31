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

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    //minute.update
    it('can update a Minute if moderator', function () {
        const aProjectName = "MinuteUpdate as moderator";
        const aMeetingName = "MinuteUpdate as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const newMinuteDate = '01.01.2000';

        expect(E2EApp.isLoggedIn()).to.be.true;
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
    });

    it('can not update a Minute as an invited user', function () {
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
    });

    //addMinute
    it('can not add a new Minute if not logged in', function () {
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
    });

    it('can add a new Minute if a moderator', function () {
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
    });

    it('can not add a new Minute if not invited to a Meeting Serie', function () {
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
    });

    //workflow.removeMinute
    it('can delete a Minute if a moderator', function () {
        const aProjectName = "MinuteDelete as moderator";
        const aMeetingName = "MinuteDelete as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
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
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        E2ESecurity.replaceMethodOnClientSide(removeMinute);
        E2ESecurity.executeMethod(removeMinute, minuteID);
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
    });

    it('can not delete a Minute if not invited to a Meeting Serie', function () {
        const aProjectName = "MinuteDelete as not invited to MS";
        const aMeetingName = "MinuteDelete as not invited to MS";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(removeMinute);
        E2ESecurity.executeMethod(removeMinute, minuteID);
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
    });

    it('can not delete a Minute as an invited user @watch', function () {
        const aProjectName = "MinuteDelete as an invited user";
        const aMeetingName = "MinuteDelete as as an invited user";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});

        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "invited");
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2, E2EGlobal.USERROLES.Invited);
        E2EMeetingSeriesEditor.closeMeetingSeriesEditor();

        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const numberOfMinutes = server.call('e2e.countMinutesInMongoDB');

        E2EApp.logoutUser();
        E2EApp.loginUser(1);
        E2ESecurity.replaceMethodOnClientSide(removeMinute);
        E2ESecurity.executeMethod(removeMinute, minuteID);
        expect((server.call('e2e.countMinutesInMongoDB'))).to.equal(numberOfMinutes);
    });


    });
