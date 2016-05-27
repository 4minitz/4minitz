
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

    static getTopicsForMinute () {
        let selector = '#accordion > div.well';
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
}
