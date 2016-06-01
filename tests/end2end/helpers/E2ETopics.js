
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
}
