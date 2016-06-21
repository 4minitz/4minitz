
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'


export class E2ETopics {
    static addTopicToMinutes (aTopic, aResponsible) {
        browser.waitForVisible("#id_showAddTopicDialog");
        browser.click("#id_showAddTopicDialog");

        E2ETopics.insertTopicDataIntoDialog(aTopic, aResponsible);
    };

    
    static openEditTopicForMinutes(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnEditTopic";
        browser.waitForVisible(selector);
        browser.click(selector);
        E2EGlobal.waitSomeTime();
    }

    static editTopicForMinutes(topicIndex, newTopicSubject, newResponsible) {
        E2ETopics.openEditTopicForMinutes(topicIndex);
        E2ETopics.insertTopicDataIntoDialog(newTopicSubject, newResponsible);
    }

    static deleteTopic(topicIndex, confirmDialog) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnDelTopic";
        browser.waitForVisible(selector);
        browser.click(selector);
        if (confirmDialog === undefined || confirmDialog) {
            E2EApp.confirmationDialogAnswer(true);
        }
    }

    static responsibleEnterFreetext(theText) {
        browser.element(".select2-selection").click();
        browser.keys(theText+"\uE007"); // plus ENTER
    }
    
    static insertTopicDataIntoDialog(subject, responsible) {
        try {
            browser.waitForVisible('#id_subject');
        } catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime();
        
        if (subject) {
            browser.setValue('#id_subject', subject);
        }
        if (responsible) {
            E2ETopics.responsibleEnterFreetext(responsible);
        }
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime(700);
    }

    static addInfoItemToTopic (infoItemDoc, topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .addTopicInfoItem";

        browser.waitForVisible(selector);
        browser.click(selector);
        E2ETopics.insertInfoItemDataIntoDialog(infoItemDoc)
    }

    static editInfoItemForTopic(topicIndex, infoItemIndex, infoItemDoc) {
        let selector = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) + "#btnEditInfoItem";

        browser.waitForVisible(selector);
        browser.click(selector);
        E2ETopics.insertInfoItemDataIntoDialog(infoItemDoc, true)
    }

    static deleteInfoItem(topicIndex, infoItemIndex, confirmDialog) {
        let selector = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) + "#btnDelInfoItem";
        browser.waitForVisible(selector);
        browser.click(selector);
        if (confirmDialog === undefined || confirmDialog) {
            E2EApp.confirmationDialogAnswer(true);
        }
    }

    static insertInfoItemDataIntoDialog(infoItemDoc, isEditMode) {
        try {
            browser.waitForVisible('#id_item_subject');
        } catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime();

        browser.setValue('#id_item_subject', infoItemDoc.subject);
        if (infoItemDoc.responsible) {
            E2ETopics.responsibleEnterFreetext(infoItemDoc.responsible);
        }
        //todo: set other fields (priority, responsible, duedate, details)

        if (!isEditMode) {
            let type = (infoItemDoc.hasOwnProperty('itemType')) ? infoItemDoc.itemType : 'infoItem';
            let radioBtnSelector = "#label_" + type;
            browser.waitForExist(radioBtnSelector);
            browser.click(radioBtnSelector);
        }

        browser.click("#btnInfoItemSave");
        E2EGlobal.waitSomeTime(700);
    }

    static toggleTopic(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .labelTopicCb";
        browser.waitForVisible(selector);
        browser.click(selector);
    }

    static toggleRecurringTopic(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-recurring";
        try {
            browser.waitForVisible(selector);
        } catch(e) {
            return false;
        }
        browser.click(selector);
    }

    static isTopicClosed(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .btnToggleState";

        return E2EGlobal.isCheckboxSelected(selector)
    }

    static isTopicRecurring(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-recurring span";
        try {
            browser.waitForVisible(selector);
        } catch(e) {
            return false;
        }
        let element = browser.element(selector);
        let classes = element.getAttribute('class');
        return (classes.indexOf('active-icon') > 1);
    }

    static toggleActionItem(topicIndex, infoItemIndex) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selector = selectInfoItem + ".checkboxLabel";
        browser.waitForVisible(selector);
        browser.click(selector);
    }

    static isActionItemClosed(topicIndex, infoItemIndex) {
        let selector = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) + ".btnToggleAIState";

        return E2EGlobal.isCheckboxSelected(selector)
    }

    static toggleInfoItemStickyState(topicIndex, infoItemIndex) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selector = selectInfoItem + ".btnPinInfoItem";
        try {
            browser.waitForVisible(selector);
        } catch (e) {
            return false;
        }
        browser.click(selector);
    }

    static isInfoItemSticky(topicIndex, infoItemIndex) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selector = selectInfoItem + ".btnPinInfoItem span";
        try {
            browser.waitForVisible(selector);
        } catch(e) {
            return false;
        }
        let element = browser.element(selector);
        let classes = element.getAttribute('class');
        return (classes.indexOf('sticky-item') > 1);
    }

    static getInfoItemSelector(topicIndex, infoItemIndex) {
        return "#topicPanel .well:nth-child(" + topicIndex + ") .topicInfoItem:nth-child(" + infoItemIndex + ") ";
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

    /**
     * Adds details to an action item.
     *
     * @param topicIndex index of the chosen topic (1=topmost ... n=#topics)
     * @param infoItemIndex index of the chosen AI (1=topmost ... n=#info items)
     * @param detailsText text to set
     * @param doBeforeSubmit callback, which will be called before submitting the changes
     * @returns {boolean}
     */
    static addDetailsToActionItem(topicIndex, infoItemIndex, detailsText, doBeforeSubmit) {
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
        if (doBeforeSubmit) {
            doBeforeSubmit(selFocusedInput);
        }
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
        let topics = E2ETopics.getTopicsForMinute();
        return (topics.length) ? topics.length : 0;
    };

    static getItemsForTopic (topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .topicInfoItem";
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return [];
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
