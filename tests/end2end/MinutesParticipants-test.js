
import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2EMinutesParticipants } from './helpers/E2EMinutesParticipants'


describe('Minutes Participants @watch', function () {
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
        expect(participantsInfo.getParticipantInfo("user1")).to.be.ok;
    });


    //
    // it('can add users to series which will show up on new minutes', function () {
    // });
    //
    //
    // it('can add users to series which will show up on unfinalized minutes', function () {
    // });
    //
    //
    // it('prohibits user changes in series to also propagate to finalized minutes ', function () {
    // });
    //
    //
    // it('can persist checked participants', function () {
    // });
    //
    //
    // it('can persist additional participants', function () {
    // });
    //
    //
    // it('can show collapsed view of participants', function () {
    // });
    //
    //
    // it('can expand a collapsed view of participants', function () {
    // });
    //
    //
    // it('prohibits invited users to change participants', function () {
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
