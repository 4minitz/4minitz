
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMinutesParticipants } from './helpers/E2EMinutesParticipants'


describe('Minutes Participants', function () {
    const aProjectName = "E2E Minutes Participants";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;


    beforeEach("goto start page and make sure test user is logged in", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect (E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });


    it('ensures per default only creator of series is participant', function () {
        let participantsInfo = new E2EMinutesParticipants();
        expect(participantsInfo.getParticipantsCount()).to.equal(1);
        expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser())).to.be.ok;
    });



    it('can add users to series which will show up on new minutes', function () {
        E2EMinutes.finalizeCurrentMinutes();    // we don't need these...

        // prepare meeting series
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        // now create some new minutes
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        let participantsInfo = new E2EMinutesParticipants();
        expect(participantsInfo.getParticipantsCount()).to.equal(3);
        expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()), "currentUser").to.be.ok;
        expect(participantsInfo.getParticipantInfo(user2), user2).to.be.ok;
        expect(participantsInfo.getParticipantInfo(user3), user3).to.be.ok;
    });


    it('can add users to series which will show up on unfinalized minutes', function () {
        // prepare meeting series
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EMinutes.gotoLatestMinutes();

        let participantsInfo = new E2EMinutesParticipants();
        expect(participantsInfo.getParticipantsCount()).to.equal(3);
        expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser()), "currentUser").to.be.ok;
        expect(participantsInfo.getParticipantInfo(user2), user2).to.be.ok;
        expect(participantsInfo.getParticipantInfo(user3), user3).to.be.ok;
    });


    it('prohibits user changes in series to propagate to all finalized minutes', function () {
        E2EMinutes.finalizeCurrentMinutes();

        // prepare meeting series
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EMinutes.gotoLatestMinutes();
        // finalized minutes have their participants collapsed, by default.
        E2EMinutesParticipants.expand();

        let participantsInfo = new E2EMinutesParticipants();
        expect(participantsInfo.getParticipantsCount()).to.equal(1);
        expect(participantsInfo.getParticipantInfo(E2EApp.getCurrentUser())).to.be.ok;
    });


    it('can persist checked participants', function () {
        // prepare meeting series
        let currentUser = E2EApp.getCurrentUser();
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        let user3 = E2EGlobal.SETTINGS.e2eTestUsers[2];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user3, E2EGlobal.USERROLES.Moderator);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EMinutes.gotoLatestMinutes();
        let minId = E2EMinutes.getCurrentMinutesId();

        let participantsInfo = new E2EMinutesParticipants();
        participantsInfo.setUserPresence(currentUser, true);
        participantsInfo.setUserPresence(user3, true);

        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        let parts = E2EMinutesParticipants.getPresentParticipantsFromServer(minId);
        expect(parts).to.contain(currentUser);
        expect(parts).to.contain(user3);
    });


    it('can persist additional participants', function () {
        let additionalUser = "Max Mustermann";
        browser.setValue('#edtParticipantsAdditional', additionalUser);
        E2EMinutes.finalizeCurrentMinutes();

        let minId = E2EMinutes.getCurrentMinutesId();
        let parts = E2EMinutesParticipants.getPresentParticipantsFromServer(minId);
        expect(parts).to.equal(additionalUser);
    });


    it('can show collapsed view of participants', function () {
        E2EMinutesParticipants.collapse();
        expect (E2EMinutesParticipants.isCollapsed()).to.be.true;
    });


    it('can re-expand a collapsed view of participants', function () {
        E2EMinutesParticipants.collapse();
        E2EMinutesParticipants.expand();
        expect (E2EMinutesParticipants.isExpanded()).to.be.true;
    });


    it('prohibits non-moderator users to change participants @watch', function () {
        // prepare meeting series
        let currentUser = E2EApp.getCurrentUser();
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        E2EGlobal.waitSomeTime(750);
        let user2 = E2EGlobal.SETTINGS.e2eTestUsers[1];
        E2EMeetingSeriesEditor.addUserToMeetingSeries(user2);
        browser.click("#btnMeetingSeriesSave"); // save & close editor dialog
        E2EGlobal.waitSomeTime();         // wait for dialog's animation

        E2EApp.loginUser(1);
        E2EMinutes.gotoLatestMinutes();

        // let participantsInfo = new E2EMinutesParticipants();
        // participantsInfo.setUserPresence(currentUser, true);
        // participantsInfo.setUserPresence(user3, true);

        E2EApp.loginUser();
    });


    // it('prohibits change of participants on finalized minutes', function () {
    // });
    //
    //
    // it('collapses / expands participants on finalize / un-finalize', function () {
    // });
    //
    //
    // it('shows participants on minutelist in meeting series details view', function () {
    // });
});
