import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries'
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor'
import { E2EMinutes } from './helpers/E2EMinutes'
import { E2ETopics } from './helpers/E2ETopics'


describe('Labels', function () {
    const aProjectName = "E2E Labels";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;
    let aTopicCounter = 0;
    let aTopicNameBase = "Topic Name #";
    let aTopicName;
    let aAICounter = 0;
    let aAINameBase = "Action Item Name #";

    let getNewMeetingName = () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };
    let getNewTopicName = () => {
        aTopicCounter++;
        return aTopicNameBase + aTopicCounter;
    };
    let getNewAIName = () => {
        aAICounter++;
        return aAINameBase + aAICounter;
    };

    beforeEach("make sure test user is logged in, create series and add minutes", function () {
        E2EApp.gotoStartPage();
        expect(browser.getTitle()).to.equal('4minitz!');
        expect(E2EApp.isLoggedIn()).to.be.true;

        aMeetingName = getNewMeetingName();

        E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        aTopicName = getNewTopicName();
        E2ETopics.addTopicToMinutes(aTopicName);
    });

    before("reload page", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.launchApp();
        }
    });

    after("clear database", function () {
        if (E2EGlobal.browserIsPhantomJS()) {
            E2EApp.resetMyApp(true);
        }
    });

    describe("Labels for Action- / Info Items", function () {

        it('can add a new custom label to an AI', function () {
            const labelName = "MyCustomLabel";
            const labelColor = "#ff0000";

            E2ETopics.addInfoItemToTopic({
                subject: getNewAIName(),
                itemType: "actionItem"
            }, 1);

            E2ETopics.addLabelToItem(1, 1, labelName + labelColor);

            var items = E2ETopics.getItemsForTopic(1);
            let firstActionITem = items[0].ELEMENT;
            let visibleText = browser.elementIdText(firstActionITem).value;
            expect(visibleText).to.have.string(labelName);
            expect(visibleText).to.not.have.string(labelColor);
        });

        it('can add a default label to an info item', function () {
            const defaultLabel = E2EGlobal.SETTINGS.defaultLabels[0].name;

            E2ETopics.addInfoItemToTopic({
                subject: getNewAIName(),
                itemType: "infoItem"
            }, 1);

            E2ETopics.addLabelToItem(1, 1, defaultLabel);

            var items = E2ETopics.getItemsForTopic(1);
            let firstActionItem = items[0].ELEMENT;
            let visibleText = browser.elementIdText(firstActionItem).value;
            expect(visibleText).to.have.string(defaultLabel);
        });

        it('changes the labels text in finalized minutes if the label will be renamed', function () {
            const labelName = 'Decision';
            const renamedLabel = 'Entscheidung';

            E2ETopics.addInfoItemToTopic({
                subject: getNewAIName(),
                itemType: "infoItem"
            }, 1);

            E2ETopics.addLabelToItem(1, 1, labelName);

            let items = E2ETopics.getItemsForTopic(1);
            let firstActionItem = items[0].ELEMENT;
            let visibleText = browser.elementIdText(firstActionItem).value;
            expect(visibleText, 'setting the label failed').to.have.string(labelName);

            E2EMinutes.finalizeCurrentMinutes();

            E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "labels");
            E2EMeetingSeriesEditor.changeLabel(labelName, renamedLabel);
            E2EMinutes.gotoLatestMinutes();

            items = E2ETopics.getItemsForTopic(1);
            firstActionItem = items[0].ELEMENT;
            visibleText = browser.elementIdText(firstActionItem).value;
            expect(visibleText, 'label name should have changed').to.have.string(renamedLabel);
        });

        it('resets the labels name if editing will be canceled', function() {
            const labelName = 'Status:RED';
            const renamedLabel = 'Test';
            const changedColor = 'ffffff';

            E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, "labels");

            let labelId = E2EMeetingSeriesEditor.changeLabel(labelName, renamedLabel, changedColor, false);
            let selLabelRow = '#row-label-' + labelId;
            browser.click(selLabelRow + ' .evt-btn-edit-cancel');

            // open editor again
            browser.click(selLabelRow + ' .evt-btn-edit-label');
            let newLabelNameValue = browser.getValue(selLabelRow + " [name='labelName']");
            expect(newLabelNameValue, "label name should be restored").to.equal(labelName);

            let newLabelColorValue = browser.getValue(selLabelRow + " [name='labelColor-" + labelId + "']");
            expect(newLabelColorValue, "label color should be restored").to.not.equal(changedColor);

            E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);
        });

    });

});