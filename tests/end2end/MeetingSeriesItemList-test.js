require('./helpers/Server');
require('./helpers/wdio_v4_to_v5');

import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

import { formatDateISO8601 } from '../../imports/helpers/date';

describe('MeetingSeries Items list', function () {
    const aProjectName = 'MeetingSeries Topic List';
    let aMeetingCounter = 0;
    let aMeetingNameBase = 'Meeting Name #';
    let aMeetingName;

    before('reload page and reset app', function () {
        E2EGlobal.logTimestamp('Starting test suite: '+E2EGlobal.getTestSpecFilename());
        server.connect();
        E2EApp.resetMyApp();
        E2EApp.launchApp();
    });

    beforeEach('goto start page and make sure test user is logged in', function () {
        E2EApp.gotoStartPage();
        expect(E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
    });


    it('displays all info- and action-items of all topics', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item', itemType: 'actionItem'}, 1);

        E2ETopics.addTopicToMinutes('some other topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information of another topic'}, 1);
        E2ETopics.addInfoItemToTopic({subject: 'some action item of another topic', itemType: 'actionItem'}, 1);

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabItems();

        expect(E2ETopics.getAllItemsFromItemList().length, 'List should have 4 items').to.equal(4);

        expect(E2ETopics.getNthItemFromItemList(0).getText(), 'First item should have correct subject').to.have.string('some action item of another topic');
        expect(E2ETopics.getNthItemFromItemList(1).getText(), 'First item should have correct subject').to.have.string('some information of another topic');
        expect(E2ETopics.getNthItemFromItemList(2).getText(), 'First item should have correct subject').to.have.string('some action item');
        expect(E2ETopics.getNthItemFromItemList(3).getText(), 'First item should have correct subject').to.have.string('some information');
    });

    it.only('can expand an info item to display its details on the item list', function () {
        E2ETopics.addTopicToMinutes('some topic');
        E2ETopics.addInfoItemToTopic({subject: 'some information'}, 1);
        E2ETopics.addDetailsToActionItem(1, 1, 'Amazing details for this information item'); 

        E2EMinutes.finalizeCurrentMinutes();

        E2EMinutes.gotoParentMeetingSeries();

        E2EMeetingSeries.gotoTabItems();

        E2ETopics.expandDetailsForNthInfoItem(1);

        expect(E2ETopics.getNthItemFromItemList(0).getText())
            .to.have.string(formatDateISO8601(new Date()) + ' New' + '\nAmazing details for this information item');
    });

});