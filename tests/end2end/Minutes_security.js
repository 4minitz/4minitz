import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2ESecurity } from './helpers/E2ESecurity'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'


describe('MeetingSeries Security', function () {
    const insertMeetingSeriesMethod = "meetingseries.insert";
    const updateMinutes = "minutes.update";

    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        E2EApp.loginUser();
        expect(E2EApp.isLoggedIn()).to.be.true;
    });

    before("reload page and reset app", function () {
        E2EApp.resetMyApp(true);
        E2EApp.launchApp();
    });

    it('can update a Minute if moderator', function () {
        const aProjectName = "MinuteUpdate as moderator";
        const aMeetingName = "MinuteUpdate as moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const newMinuteDate = '01.01.2000';

        expect(E2EApp.isLoggedIn()).to.be.true;
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

    it('can not update a Minute if not moderator', function () {
        const aProjectName = "MinuteUpdate as not moderator";
        const aMeetingName = "MinuteUpdate as not moderator";
        E2ESecurity.executeMethod(insertMeetingSeriesMethod, {project: aProjectName, name: aMeetingName});
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        const minuteID =  E2EMinutes.getCurrentMinutesId();
        const minuteDate = E2EMinutes.getCurrentMinutesDate();
        const newMinuteDate = '01.01.2000';

        E2EApp.loginUser(1);
        expect(E2EApp.isLoggedIn()).to.be.true;
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
        E2ESecurity.executeMethod(updateMinutes, {_id: minuteID, date: newMinuteDate});
        expect((server.call('e2e.findMinute', minuteID)).date).to.equal(minuteDate);
    });

    });
