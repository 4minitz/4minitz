require('./helpers/Server');
require('./helpers/wdio_v4_to_v5');

import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';


describe('MeetingSeries', function () {
    before('reload page and reset app', function () {
        console.log('Executing: '+E2EGlobal.getTestSpecFilename());
        server.connect();
        E2EGlobal.logTimestamp('Start test suite');
        E2EApp.resetMyApp();
        E2EApp.launchApp();
    });

    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect (E2EApp.isLoggedIn()).to.be.true;
    });

    it('can create a first meeting series', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #1';
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can create a further meeting series', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #2';
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can submit the form by pressing enter in the meetingname input', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #2.7182818284';
        const initialCount = E2EMeetingSeries.countMeetingSeries();

        E2EMeetingSeries.editMeetingSeriesForm(aProjectName, aMeetingName + '\n');
        E2EGlobal.waitSomeTime(500);
        E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');

        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can not create meeting series with empty project', function () {
        const aProjectName = '';
        const aMeetingName = 'Meeting Name #2.1';
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can not create meeting series with empty name', function () {
        const aProjectName = 'E2E Project - Unknown series';
        const aMeetingName = '';
        const initialCount = E2EMeetingSeries.countMeetingSeries();
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        expect(E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can goto meeting series details', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #4';
        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(E2EApp.isOnStartPage()).to.be.false;
    });
});
