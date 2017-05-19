
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'


export class E2ETopics {
    static addTopicToMinutes (aTopic, aResponsible) {
        browser.waitForVisible("#id_showAddTopicDialog");
        browser.click("#id_showAddTopicDialog");

        E2ETopics.insertTopicDataIntoDialog(aTopic, aResponsible);
        E2ETopics.submitTopicDialog();
    };

    static addTopicWithLabelToMinutes (aTopic,label) {
        browser.waitForVisible("#id_showAddTopicDialog");
        browser.click("#id_showAddTopicDialog");

        E2ETopics.insertTopicDataWithLabelIntoDialog(aTopic, label);
        E2ETopics.submitTopicDialog();
    };

    static addTopicToMinutesAtEnd (aTopic, aResonsible) {
        browser.waitForVisible("#addTopicField");
        browser.click("#addTopicField");

        E2ETopics.insertTopicDataAtEnd(aTopic, aResonsible);
        E2ETopics.submitTopicAtEnd();
    }
    
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
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
        browser.waitForVisible(selector);
        browser.click(selector);
        browser.click("#topicPanel .well:nth-child(" + topicIndex + ") #btnDelTopic");
        if (confirmDialog === undefined) {
            return;
        }
        E2EApp.confirmationDialogAnswer(confirmDialog);
    }

    static label2TopicEnterFreetext(labelName) {
        browser.element('#id_subject').click();
        browser.keys("\uE004"); // Tab to reach next input field => labels
        browser.keys(labelName+"\uE007"); // plus ENTER
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
        browser.element('#id_subject').click();
        browser.keys("\uE004\uE004"); // Tab to reach next input field => labels
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

    static insertTopicDataWithLabelIntoDialog(subject, label) {
        try {
            browser.waitForVisible('#id_subject');
            browser.waitForVisible('#id_item_selLabels');
        } catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime();

        if (subject) {
            browser.setValue('#id_subject', subject);
        }
        if(label) {
            E2ETopics.label2TopicEnterFreetext(label);
        }
    }

    static insertTopicDataAtEnd(subject, responsible) {
        try {
            browser.waitForVisible('#addTopicField');
        }
        catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime();

        if (subject) {
            browser.setValue('#addTopicField', subject);
        }
        if (responsible) {
            E2ETopics.responsible2TopicEnterFreetext(responsible);
        }
    }

    static submitTopicDialog() {
        browser.click("#btnTopicSave");
        E2EGlobal.waitSomeTime(700);
    }

    static submitTopicAtEnd() {
        browser.keys("Enter");
        E2EGlobal.waitSomeTime(700);
    }

    static openInfoItemDialog(topicIndex, type="infoItem") {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";

        browser.waitForVisible(selector);
        browser.click(selector);
        let typeClass = ".addTopicInfoItem";
        if (type === "actionItem") {
            typeClass = ".addTopicActionItem";
        }
        browser.click("#topicPanel .well:nth-child(" + topicIndex + ") "+typeClass);
    }

    static addInfoItemToTopic (infoItemDoc, topicIndex, autoCloseDetailInput = true) {
        let type = (infoItemDoc.hasOwnProperty('itemType')) ? infoItemDoc.itemType : 'infoItem';
        this.openInfoItemDialog(topicIndex, type);
        this.insertInfoItemDataIntoDialog(infoItemDoc);
        this.submitInfoItemDialog();

        E2EGlobal.waitSomeTime();
        if (autoCloseDetailInput) {
            E2EGlobal.waitSomeTime(600);
            browser.keys(['Escape']);
            E2EGlobal.waitSomeTime();
        }
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
        let selOpenMenu = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) + "#btnItemDropdownMenu";
        browser.waitForVisible(selOpenMenu);
        browser.click(selOpenMenu);
        let selDelete = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) + "#btnDelInfoItem";
        browser.click(selDelete);

        if (confirmDialog === undefined) {
            return;
        }
        E2EApp.confirmationDialogAnswer(confirmDialog);
    }

    static insertInfoItemDataIntoDialog(infoItemDoc) {
        try {
            browser.waitForVisible('#id_item_subject');
        } catch (e) {
            return false;
        }
        E2EGlobal.waitSomeTime(500);

        if (infoItemDoc.subject) {
            browser.setValue('#id_item_subject', infoItemDoc.subject);
        }
        if (infoItemDoc.label) {
            E2ETopics.labelEnterFreetext(infoItemDoc.label);
        }
        if (infoItemDoc.responsible) {
            E2ETopics.responsible2ItemEnterFreetext(infoItemDoc.responsible);
        }
        if (infoItemDoc.priority) {
            browser.setValue('#id_item_priority', infoItemDoc.priority);
        }

        //todo: set other fields (duedate)

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
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
        try {
            // we use the "_org" / non screen shot version here intentionally,
            // as we often expect the 'recurring icon' to be hidden!
            browser.waitForVisible_org(selector);
        } catch(e) {
            return false;
        }
        browser.click(selector);
        browser.click("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-recurring");
    }
    
    static toggleSkipTopic(topicIndex, useDropDownMenu = true)
    {
        // The 2nd parameter determines if the skip should be done via the dropdown-menu or by directly clicking the IsSkipped-Icon shown on the topic. 
        // The latter one will of course only work if the topic is currently skipped
        if (useDropDownMenu) {
            let selector = "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
            try {
                // we use the "_org" / non screen shot version here intentionally,
                // as we often expect the 'recurring icon' to be hidden!
                browser.waitForVisible_org(selector);
            } catch(e) {
                return false;
            }
            browser.click(selector);
            browser.click("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-skipped");
        }
        else {
            E2EGlobal.waitSomeTime();
            browser.click("#topicPanel .well:nth-child(" + topicIndex + ") #topicIsSkippedIcon");
        }
    }

    static isTopicClosed(topicIndex) {
        let selector = "#topicPanel .well:nth-child(" + topicIndex + ") .btnToggleState";

        return E2EGlobal.isCheckboxSelected(selector)
    }

    static isTopicRecurring(topicIndex) {
        return this._isSelectorVisible("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-recurring span");
    }
    
    static isTopicSkipped(topicIndex) {
        return this._isSelectorVisible("#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-skipped span");
    }
    
    static _isSelectorVisible(selector)
    {
        try {
            // we use the "_org" / non screen shot version here intentionally,
            // as we often expect the 'recurring icon' to be hidden!
            browser.waitForVisible_org(selector);
            return true;
        } catch(e) {
            return false;
        }       
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
        let selectorOpenMenu = selectInfoItem + "#btnItemDropdownMenu";
        try {
            browser.waitForVisible_org(selectorOpenMenu);
        } catch (e) {
            return false;
        }
        browser.click(selectorOpenMenu);

        let selector = selectInfoItem + ".btnPinInfoItem";
        browser.click(selector);
    }

    static isInfoItemSticky(topicIndex, infoItemIndex) {
        let selectInfoItem = E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex);

        let selector = selectInfoItem + ".btnPinInfoItem span";
        try {
            browser.waitForVisible(selector);
            return true;
        } catch(e) {
            return false;
        }
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

        let selOpenMenu = selectInfoItem + "#btnItemDropdownMenu";
        try {
            browser.waitForVisible(selOpenMenu);
        } catch (e) {
            return false;
        }
        browser.click(selOpenMenu);

        let selAddDetails = selectInfoItem + ".addDetail";
        browser.click(selAddDetails);

        let newId = E2ETopics.countDetailsForItem(topicIndex, infoItemIndex);
        let selDetails = selectInfoItem + ".detailRow:nth-child(" + newId + ") ";
        let selFocusedInput = selDetails + ".detailInput";
        try {
            browser.waitForVisible(selFocusedInput);
        } catch (e) {
            console.error('Could not add details. Input field not visible');
            return false;
        }
        browser.setValue(selFocusedInput, detailsText);
        if (doBeforeSubmit) {
            doBeforeSubmit(selFocusedInput);
        }
        browser.keys(['Escape']);
        E2EGlobal.waitSomeTime(400);
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

    static getLastTopicForMinute() {
        let topics = E2ETopics.getTopicsForMinute();
        return topics[topics.length-1];
    }

    static getItemsForTopic (topicIndexOrSelectorForParentElement) {
        let parentSel = topicIndexOrSelectorForParentElement;
        if (!isNaN(parentSel)) {
            parentSel = "#topicPanel .well:nth-child(" + topicIndexOrSelectorForParentElement + ")";
        }
        let selector = parentSel + " .topicInfoItem";
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
