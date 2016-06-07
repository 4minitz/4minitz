
import { E2EGlobal } from './E2EGlobal'


export class E2ETopics {
    static addTopicToMinutes (aTopic) {
        browser.waitForVisible("#id_showAddTopicDialog");
        browser.click("#id_showAddTopicDialog");

        try {
            browser.waitForVisible('#id_subject');
        } catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime();

        browser.setValue('#id_subject', aTopic);
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime(700);
    };

    static addInfoItemToTopic (infoItemDoc, topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .addTopicInfoItem";

        browser.waitForVisible(selector);
        browser.click(selector);
        try {
            browser.waitForVisible('#id_item_subject');
        } catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime();

        browser.setValue('#id_item_subject', infoItemDoc.subject);
        let type = (infoItemDoc.hasOwnProperty('itemType')) ? infoItemDoc.itemType : 'infoItem';
        let radioBtnSelector = "#label_" + type;
        browser.waitForExist(radioBtnSelector);
        browser.click(radioBtnSelector);

        //todo: set other fields (priority, responsible, duedate, details)
        browser.click("#btnInfoItemSave");
        E2EGlobal.waitSomeTime(700);
    }

    static getInfoItemSelector(topicIndex, infoItemIndex) {
        return "#topicPanel .well:nth-child(" + topicIndex + ") #accordion:nth-child(" + infoItemIndex + ") ";
    }

    static expandDetailsForActionItem(topicIndex, infoItemIndex) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selOpenDetails = selectInfoItem + ".expandDetails";
        browser.waitForVisible(selOpenDetails);

        try {
            browser.waitForVisible(selectInfoItem + ".detailRow");
        } catch (e) {
            browser.click(selOpenDetails);
        }
    }

    static addDetailsToActionItem(topicIndex, infoItemIndex, detailsText) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        E2ETopics.expandDetailsForActionItem(topicIndex, infoItemIndex);

        let selAddDetails = selectInfoItem + ".addDetail";
        try {
            browser.waitForVisible(selAddDetails);
        } catch (e) {
            return false;
        }
        browser.click(selAddDetails);

        let newId = E2ETopics.countDetailsForItem(topicIndex, infoItemIndex)-1;
        let selFocusedInput = "#detailInput_" + newId;
        try {
            browser.waitForVisible(selFocusedInput);
        } catch (e) {
            return false;
        }
        browser.setValue(selFocusedInput, detailsText);
        browser.keys(['Escape']);
    }

    static changeDetailsForActionItem(topicIndex, infoItemIndex, detailsIndex, detailsText) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        E2ETopics.expandDetailsForActionItem(topicIndex, infoItemIndex);

        let selDateCol = selectInfoItem + ".actionItemDetails:nth-child(" + detailsIndex + ") .detailDate";
        browser.waitForVisible(selDateCol);
        browser.click(selDateCol);

        let newId = E2ETopics.countDetailsForItem(topicIndex, infoItemIndex)-1;
        let selFocusedInput = "#detailInput_" + newId;
        try {
            browser.waitForVisible(selFocusedInput);
        } catch (e) {
            return false;
        }
        browser.setValue(selFocusedInput, detailsText);
        browser.keys(['Escape']);
    }

    static getTopicsForMinute () {
        let selector = '#topicPanel > div.well';
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return 0;
        }
        const elements = browser.elements(selector);
        return elements.value;
    };

    static countTopicsForMinute () {
        var topics = E2ETopics.getTopicsForMinute();
        return topics.length;
    };

    static getItemsForTopic (topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .topicInfoItem";
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return 0;
        }
        const elements = browser.elements(selector);
        return elements.value;
    }

    static countItemsForTopic (topicIndex) {
        let items = E2ETopics.getItemsForTopic(topicIndex);
        return items.length;
    }

    static getDetailsForItem(topicIndex, infoItemIndex) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        E2ETopics.expandDetailsForActionItem(topicIndex, infoItemIndex);

        let selector = selectInfoItem + " .detailRow";
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return 0;
        }
        const elements = browser.elements(selector);
        return elements.value;
    }

    static countDetailsForItem(topicIndex, infoItemIndex) {
        let details = E2ETopics.getDetailsForItem(topicIndex, infoItemIndex);
        return details.length;
    }
}
