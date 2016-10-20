
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'


export class E2ETopics {
    static addTopicToMinutes (aTopic, aResponsible) {
        browser.waitForVisible("#id_showAddTopicDialog");
        browser.click("#id_showAddTopicDialog");

        E2ETopics.insertTopicDataIntoDialog(aTopic, aResponsible);
        E2ETopics.submitTopicDialog();
    };

    
    static openEditTopicForMinutes(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnEditTopic";
        browser.waitForVisible(selector);
        browser.click(selector);
        E2EGlobal.waitSomeTime(500);
    }

    static editTopicForMinutes(topicIndex, newTopicSubject, newResponsible) {
        E2ETopics.openEditTopicForMinutes(topicIndex);
        E2ETopics.insertTopicDataIntoDialog(newTopicSubject, newResponsible);
        E2ETopics.submitTopicDialog();
    }

    static deleteTopic(topicIndex, confirmDialog) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnDelTopic";
        browser.waitForVisible(selector);
        browser.click(selector);
        if (confirmDialog === undefined) {
            return;
        }
        E2EApp.confirmationDialogAnswer(confirmDialog);
    }

    static responsible2ItemEnterFreetext(theText) {
        E2EGlobal.waitSomeTime();

        // &%$#$@! - the following does not work => Uncaught Error: element not visible
        // browser.element(".form-group-responsibles .select2-selection").click();
        // ... so we take this as workaround: click into first select2 then Tab/Tab to the next one

        browser.element(".form-group-labels .select2-selection").click();
        browser.keys("\uE004\uE004"); // 2 x Tab to reach next select2

        let texts = theText.split(",");
        for (let i in texts) {
            browser.keys(texts[i]+"\uE007"); // plus ENTER
        }
    }

    static responsible2TopicEnterFreetext(theText) {
        browser.element(".select2-selection").click();
        browser.keys(theText+"\uE007"); // plus ENTER
    }

    static labelEnterFreetext(theText) {
        E2EGlobal.waitSomeTime();
        browser.element(".form-group-labels .select2-selection").click();
        E2EGlobal.waitSomeTime();
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
            E2ETopics.responsible2TopicEnterFreetext(responsible);
        }
    }

    static submitTopicDialog() {
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime(700);
    }

    static openInfoItemDialog(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .addTopicInfoItem";

        browser.waitForVisible(selector);
        browser.click(selector);
    }

    static addInfoItemToTopic (infoItemDoc, topicIndex) {
        this.openInfoItemDialog(topicIndex);
        this.insertInfoItemDataIntoDialog(infoItemDoc);
        this.submitInfoItemDialog();
    }

    static openInfoItemEditor(topicIndex, infoItemIndex) {
        let selector = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) + "#btnEditInfoItem";

        browser.waitForVisible(selector);
        browser.click(selector);

        E2EGlobal.waitSomeTime();
    }

    static editInfoItemForTopic(topicIndex, infoItemIndex, infoItemDoc) {
        E2ETopics.openInfoItemEditor(topicIndex, infoItemIndex, infoItemDoc);

        this.insertInfoItemDataIntoDialog(infoItemDoc, true);
        this.submitInfoItemDialog();
    }

    static addLabelToItem(topicIndex, infoItemIndex, labelName) {
        E2ETopics.openInfoItemEditor(topicIndex, infoItemIndex);
        E2ETopics.labelEnterFreetext(labelName);
        browser.click("#btnInfoItemSave");
        E2EGlobal.waitSomeTime(700);
    }

    static deleteInfoItem(topicIndex, infoItemIndex, confirmDialog) {
        let selector = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) + "#btnDelInfoItem";
        browser.waitForVisible(selector);
        browser.click(selector);
        if (confirmDialog === undefined) {
            return;
        } 
        E2EApp.confirmationDialogAnswer(confirmDialog);
    }

    static insertInfoItemDataIntoDialog(infoItemDoc, isEditMode) {
        try {
            browser.waitForVisible('#id_item_subject');
        } catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime(500);

        browser.setValue('#id_item_subject', infoItemDoc.subject);

        if (!isEditMode) {
            let type = (infoItemDoc.hasOwnProperty('itemType')) ? infoItemDoc.itemType : 'infoItem';
            let radioBtnSelector = "#label_" + type;
            browser.waitForExist(radioBtnSelector);
            browser.click(radioBtnSelector);
        }
        E2EGlobal.waitSomeTime();

        //todo: set other fields (duedate, details)

        if (infoItemDoc.responsible) {
            E2ETopics.responsible2ItemEnterFreetext(infoItemDoc.responsible);
        }

        if (infoItemDoc.priority) {
            browser.setValue('#id_item_priority', infoItemDoc.priority);
        }
    }

    static submitInfoItemDialog() {
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

    static expandDetails(selectorForInfoItem) {
        let selOpenDetails = selectorForInfoItem + ".expandDetails";
        browser.waitForVisible(selOpenDetails);

        try {
            browser.waitForVisible(selectorForInfoItem + ".detailRow");
        } catch (e) {
            browser.click(selOpenDetails);
        }
    }

    static expandDetailsForActionItem(topicIndex, infoItemIndex) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        E2ETopics.expandDetails(selectInfoItem);
    }

    static expandDetailsForNthInfoItem(n) {
        let selectInfoItem = "#itemPanel .topicInfoItem:nth-child(" + n + ") ";
        E2ETopics.expandDetails(selectInfoItem);
        E2EGlobal.waitSomeTime();
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

        let selAddDetails = selectInfoItem + ".addDetail";
        try {
            browser.waitForVisible(selAddDetails);
        } catch (e) {
            return false;
        }
        browser.click(selAddDetails);

        let newId = E2ETopics.countDetailsForItem(topicIndex, infoItemIndex);
        let selDetails = selectInfoItem + ".detailRow:nth-child(" + newId + ") ";
        let selFocusedInput = selDetails + ".detailInput";
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
        E2EGlobal.waitSomeTime(250);
    }

    static editDetailsForActionItem(topicIndex, infoItemIndex, detailIndex, detailsText) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);
        E2ETopics.expandDetailsForActionItem(topicIndex, infoItemIndex);

        let selDetails = selectInfoItem + ".detailRow:nth-child(" + detailIndex + ") ";

        let selEditDetails = selDetails + ".detailText";
        try {
            browser.waitForVisible(selEditDetails);
        } catch (e) {
            console.log("detailText not visible");
            return false;
        }
        browser.click(selEditDetails);

        let selFocusedInput = selDetails + ".detailInput";
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

    static getAllItemsFromItemList() {
        let selector = ".topicInfoItem";
        try {
            browser.waitForExist(selector);
        } catch (e) {
            return [];
        }
        return browser.elements(selector).value;
    }

    static getNthItemFromItemList(n) {
        const elements = E2ETopics.getAllItemsFromItemList();
        return browser.elementIdText(elements[n].ELEMENT);
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
