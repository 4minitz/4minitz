import { E2EGlobal } from "./E2EGlobal";
import { E2EApp } from "./E2EApp";

export class E2ETopics {
  static addTopicToMinutes(aTopic, aResponsible) {
    browser.waitForVisible("#id_showAddTopicDialog");
    E2EGlobal.clickWithRetry("#id_showAddTopicDialog");

    E2ETopics.insertTopicDataIntoDialog(aTopic, aResponsible);
    E2ETopics.submitTopicDialog();
  }

  static addTopicWithLabelToMinutes(aTopic, label) {
    browser.waitForVisible("#id_showAddTopicDialog");
    E2EGlobal.clickWithRetry("#id_showAddTopicDialog");

    E2ETopics.insertTopicDataWithLabelIntoDialog(aTopic, label);
    E2ETopics.submitTopicDialog();
  }

  static addTopicToMinutesAtEnd(aTopic, aResonsible) {
    browser.waitForVisible("#addTopicField");
    E2EGlobal.clickWithRetry("#addTopicField");

    E2ETopics.insertTopicDataAtEnd(aTopic, aResonsible);
    E2ETopics.submitTopicAtEnd();
  }

  static openEditTopicForMinutes(topicIndex) {
    let selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnEditTopic";
    browser.waitForVisible(selector);
    E2EGlobal.clickWithRetry(selector);
    E2EGlobal.waitSomeTime(500);
  }

  static editTopicForMinutes(topicIndex, newTopicSubject, newResponsible) {
    E2ETopics.openEditTopicForMinutes(topicIndex);
    E2ETopics.insertTopicDataIntoDialog(newTopicSubject, newResponsible);
    E2ETopics.submitTopicDialog();
  }

  static deleteTopic(topicIndex, confirmDialog) {
    const selectorMenu =
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
    browser.waitForVisible(selectorMenu);
    E2EGlobal.clickWithRetry(selectorMenu);
    const selectorDeleteBtn =
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnDelTopic";
    browser.waitForVisible(selectorDeleteBtn);
    E2EGlobal.clickWithRetry(selectorDeleteBtn);
    if (confirmDialog === undefined) {
      return;
    }
    E2EApp.confirmationDialogAnswer(confirmDialog);
  }

  static label2TopicEnterFreetext(labelName) {
    browser.element("#id_subject").click();
    browser.keys("\uE004"); // Tab to reach next input field => labels
    browser.keys(labelName + "\uE007"); // plus ENTER
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
      browser.keys(texts[i]);
      E2EGlobal.waitSomeTime(300);
      browser.keys("\uE007"); // ENTER
    }
  }

  static responsible2TopicEnterFreetext(theText) {
    browser.element("#id_subject").click();
    browser.keys("\uE004\uE004"); // Tab to reach next input field => labels
    browser.keys(theText);
    E2EGlobal.waitSomeTime();
    browser.keys("\uE007"); // plus ENTER
  }

  static labelEnterFreetext(theText) {
    E2EGlobal.waitSomeTime();
    browser.element(".form-group-labels .select2-selection").click();
    E2EGlobal.waitSomeTime();
    browser.keys(theText + "\uE007"); // plus ENTER
  }

  static insertTopicDataIntoDialog(subject, responsible) {
    try {
      browser.waitForVisible("#id_subject");
    } catch (e) {
      return false;
    }
    E2EGlobal.waitSomeTime();

    if (subject) {
      E2EGlobal.setValueSafe("#id_subject", subject);
    }
    if (responsible) {
      E2ETopics.responsible2TopicEnterFreetext(responsible);
    }
  }

  static insertTopicDataWithLabelIntoDialog(subject, label) {
    try {
      browser.waitForVisible("#id_subject");
      browser.waitForVisible("#id_item_selLabels");
    } catch (e) {
      return false;
    }
    E2EGlobal.waitSomeTime();

    if (subject) {
      E2EGlobal.setValueSafe("#id_subject", subject);
    }
    if (label) {
      E2ETopics.label2TopicEnterFreetext(label);
    }
  }

  static insertTopicDataAtEnd(subject, responsible) {
    try {
      browser.waitForVisible("#addTopicField");
    } catch (e) {
      return false;
    }
    E2EGlobal.waitSomeTime();

    if (subject) {
      E2EGlobal.setValueSafe("#addTopicField", subject);
    }
    if (responsible) {
      E2ETopics.responsible2TopicEnterFreetext(responsible);
    }
  }

  static submitTopicDialog() {
    E2EGlobal.clickWithRetry("#btnTopicSave");

    const waitForInvisible = true;
    browser.waitForVisible("#dlgAddTopic", 10000, waitForInvisible);
    E2EGlobal.waitSomeTime(700);
  }

  static submitTopicAtEnd() {
    browser.keys("Enter");
    E2EGlobal.waitSomeTime(700);
  }

  static openInfoItemDialog(topicIndex, type = "infoItem") {
    let selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";

    browser.waitForVisible(selector, 2000);
    E2EGlobal.clickWithRetry(selector);
    let typeClass = ".addTopicInfoItem";
    if (type === "actionItem") {
      typeClass = ".addTopicActionItem";
    }
    E2EGlobal.clickWithRetry(
      "#topicPanel .well:nth-child(" + topicIndex + ") " + typeClass,
    );

    browser.waitForVisible("#id_item_subject", 5000);
  }

  static addInfoItemToTopic(
    infoItemDoc,
    topicIndex,
    autoCloseDetailInput = true,
  ) {
    let type = Object.prototype.hasOwnProperty.call(infoItemDoc, "itemType")
      ? infoItemDoc.itemType
      : "infoItem";
    this.openInfoItemDialog(topicIndex, type);
    this.insertInfoItemDataIntoDialog(infoItemDoc);
    this.submitInfoItemDialog();

    E2EGlobal.waitSomeTime();
    if (autoCloseDetailInput) {
      E2EGlobal.waitSomeTime(600);
      browser.keys(["Escape"]);
      E2EGlobal.waitSomeTime();
    }
  }

  static openInfoItemEditor(topicIndex, infoItemIndex) {
    let selector =
      E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) +
      ".btnEditInfoItem";

    browser.waitForVisible(selector);
    E2EGlobal.clickWithRetry(selector);

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
    E2EGlobal.clickWithRetry("#btnInfoItemSave");
    E2EGlobal.waitSomeTime(700);
  }

  static deleteInfoItem(topicIndex, infoItemIndex, confirmDialog) {
    let selOpenMenu =
      E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) +
      "#btnItemDropdownMenu";
    browser.waitForVisible(selOpenMenu);
    E2EGlobal.clickWithRetry(selOpenMenu);
    let selDelete =
      E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) +
      "#btnDelInfoItem";
    browser.waitForVisible(selDelete);
    E2EGlobal.clickWithRetry(selDelete);

    if (confirmDialog === undefined) {
      return;
    }
    E2EApp.confirmationDialogAnswer(confirmDialog);
  }

  static insertInfoItemDataIntoDialog(infoItemDoc) {
    if (!browser.isVisible("#id_item_subject")) {
      throw new Error("Info item dialog is not visible");
    }

    if (infoItemDoc.subject) {
      E2EGlobal.setValueSafe("#id_item_subject", infoItemDoc.subject);
    }
    if (infoItemDoc.label) {
      E2ETopics.labelEnterFreetext(infoItemDoc.label);
    }
    if (infoItemDoc.responsible) {
      E2ETopics.responsible2ItemEnterFreetext(infoItemDoc.responsible);
    }
    if (infoItemDoc.priority) {
      const nthChild = infoItemDoc.priority;
      E2EGlobal.clickWithRetry(
        `#id_item_priority option:nth-child(${nthChild})`,
      );
    }

    //todo: set other fields (duedate)
  }

  static submitInfoItemDialog() {
    E2EGlobal.clickWithRetry("#btnInfoItemSave");
    E2EGlobal.waitSomeTime(700);
  }

  static toggleTopic(topicIndex) {
    let selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") .labelTopicCb";
    browser.waitForVisible(selector);
    E2EGlobal.clickWithRetry(selector);
  }

  static toggleRecurringTopic(topicIndex) {
    let selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
    try {
      // we use the "_org" / non screen shot version here intentionally,
      // as we often expect the 'recurring icon' to be hidden!
      browser.waitForVisible_org(selector);
    } catch (e) {
      return false;
    }
    E2EGlobal.clickWithRetry(selector);
    E2EGlobal.clickWithRetry(
      "#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-recurring",
    );
  }

  static toggleSkipTopic(topicIndex, useDropDownMenu = true) {
    // The 2nd parameter determines if the skip should be done via the dropdown-menu or by directly clicking the IsSkipped-Icon shown on the topic.
    // The latter one will of course only work if the topic is currently skipped
    if (useDropDownMenu) {
      let selector =
        "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
      try {
        // we use the "_org" / non screen shot version here intentionally,
        // as we often expect the 'recurring icon' to be hidden!
        browser.waitForVisible_org(selector);
      } catch (e) {
        return false;
      }
      E2EGlobal.clickWithRetry(selector);
      E2EGlobal.clickWithRetry(
        "#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-skipped",
      );
    } else {
      E2EGlobal.waitSomeTime();
      E2EGlobal.clickWithRetry(
        "#topicPanel .well:nth-child(" + topicIndex + ") #topicIsSkippedIcon",
      );
    }
  }

  static isTopicClosed(topicIndex) {
    let selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") .btnToggleState";

    return E2EGlobal.isCheckboxSelected(selector);
  }

  static isTopicRecurring(topicIndex) {
    return this._isSelectorVisible(
      "#topicPanel .well:nth-child(" +
        topicIndex +
        ") .js-toggle-recurring span",
    );
  }

  static isTopicSkipped(topicIndex) {
    return this._isSelectorVisible(
      "#topicPanel .well:nth-child(" + topicIndex + ") .js-toggle-skipped span",
    );
  }

  static _isSelectorVisible(selector) {
    try {
      // we use the "_org" / non screen shot version here intentionally,
      // as we often expect the 'recurring icon' to be hidden!
      browser.waitForVisible_org(selector);
      return true;
    } catch (e) {
      return false;
    }
  }

  static hasDropDownMenuButton(topicIndex, buttonSelector) {
    if (!buttonSelector) return false;

    let selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
    try {
      // we use the "_org" / non screen shot version here intentionally,
      // as we often expect the 'dropdown icon' to be hidden!
      browser.waitForVisible_org(selector);
    } catch (e) {
      return false;
    }
    E2EGlobal.clickWithRetry(selector);
    return browser.isVisible(
      "#topicPanel .well:nth-child(" + topicIndex + ") " + buttonSelector,
    );
  }

  static reOpenTopic(topicIndex) {
    let selector =
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnTopicDropdownMenu";
    try {
      // we use the "_org" / non screen shot version here intentionally,
      // as we often expect the 'recurring icon' to be hidden!
      browser.waitForVisible_org(selector);
    } catch (e) {
      return false;
    }
    E2EGlobal.clickWithRetry(selector);
    E2EGlobal.clickWithRetry(
      "#topicPanel .well:nth-child(" + topicIndex + ") #btnReopenTopic",
    );
    E2EApp.confirmationDialogAnswer(true);
  }

  static toggleActionItem(topicIndex, infoItemIndex) {
    let selectInfoItem = E2ETopics.getInfoItemSelector(
      topicIndex,
      infoItemIndex,
    );

    let selector = selectInfoItem + ".checkboxLabel";
    browser.waitForVisible(selector);
    E2EGlobal.clickWithRetry(selector);
  }

  static isActionItemClosed(topicIndex, infoItemIndex) {
    let selector =
      E2ETopics.getInfoItemSelector(topicIndex, infoItemIndex) +
      ".btnToggleAIState";

    return E2EGlobal.isCheckboxSelected(selector);
  }

  static toggleInfoItemStickyState(topicIndex, infoItemIndex) {
    let selectInfoItem = E2ETopics.getInfoItemSelector(
      topicIndex,
      infoItemIndex,
    );
    let selectorOpenMenu = selectInfoItem + "#btnItemDropdownMenu";
    try {
      browser.waitForVisible_org(selectorOpenMenu);
    } catch (e) {
      return false;
    }
    E2EGlobal.clickWithRetry(selectorOpenMenu);

    let selector = selectInfoItem + ".btnPinInfoItem";
    E2EGlobal.clickWithRetry(selector);
  }

  static isInfoItemSticky(topicIndex, infoItemIndex) {
    let selectInfoItem = E2ETopics.getInfoItemSelector(
      topicIndex,
      infoItemIndex,
    );

    let selector = selectInfoItem + ".btnPinInfoItem span";
    try {
      browser.waitForVisible(selector);
      return true;
    } catch (e) {
      return false;
    }
  }

  static getInfoItemSelector(topicIndex, infoItemIndex) {
    return (
      "#topicPanel .well:nth-child(" +
      topicIndex +
      ") .topicInfoItem:nth-child(" +
      infoItemIndex +
      ") "
    );
  }

  static expandDetails(selectorForInfoItem) {
    let selOpenDetails = selectorForInfoItem + ".expandDetails";
    browser.waitForVisible(selOpenDetails);

    try {
      browser.waitForVisible(selectorForInfoItem + ".detailRow");
    } catch (e) {
      E2EGlobal.clickWithRetry(selOpenDetails);
    }
  }

  static expandDetailsForActionItem(topicIndex, infoItemIndex) {
    let selectInfoItem = E2ETopics.getInfoItemSelector(
      topicIndex,
      infoItemIndex,
    );

    E2ETopics.expandDetails(selectInfoItem);
  }

  static expandDetailsForNthInfoItem(n) {
    let selectInfoItem = "#itemPanel .topicInfoItem:nth-child(" + n + ") ";
    E2ETopics.expandDetails(selectInfoItem);
    E2EGlobal.waitSomeTime();
  }

  static addFirstDetailsToNewInfoItem(
    infoItemDoc,
    topicIndex,
    detailsText,
    autoCloseDetailInput = true,
  ) {
    let type = Object.prototype.hasOwnProperty.call(infoItemDoc, "itemType")
      ? infoItemDoc.itemType
      : "infoItem";
    this.openInfoItemDialog(topicIndex, type);
    this.insertInfoItemDataIntoDialog(infoItemDoc);

    browser.setValue("#id_item_detailInput", detailsText);
    this.submitInfoItemDialog();
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
  static addDetailsToActionItem(
    topicIndex,
    infoItemIndex,
    detailsText,
    doBeforeSubmit,
  ) {
    let selectInfoItem = E2ETopics.getInfoItemSelector(
      topicIndex,
      infoItemIndex,
    );

    let selOpenMenu = selectInfoItem + "#btnItemDropdownMenu";
    try {
      browser.waitForVisible(selOpenMenu);
    } catch (e) {
      return false;
    }
    E2EGlobal.clickWithRetry(selOpenMenu);

    let selAddDetails = selectInfoItem + ".addDetail";
    E2EGlobal.clickWithRetry(selAddDetails);

    let newId = E2ETopics.countDetailsForItem(topicIndex, infoItemIndex);
    let selDetails = selectInfoItem + ".detailRow:nth-child(" + newId + ") ";
    let selFocusedInput = selDetails + ".detailInput";
    try {
      browser.waitForVisible(selFocusedInput);
    } catch (e) {
      console.error("Could not add details. Input field not visible");
      return false;
    }
    E2EGlobal.setValueSafe(selFocusedInput, detailsText);
    if (doBeforeSubmit) {
      doBeforeSubmit(selFocusedInput);
    }
    browser.keys(["Tab"]);
    E2EGlobal.waitSomeTime(400);
  }

  static editDetailsForActionItem(
    topicIndex,
    infoItemIndex,
    detailIndex,
    detailsText,
  ) {
    let selectInfoItem = E2ETopics.getInfoItemSelector(
      topicIndex,
      infoItemIndex,
    );
    E2ETopics.expandDetailsForActionItem(topicIndex, infoItemIndex);

    let selDetails =
      selectInfoItem + ".detailRow:nth-child(" + detailIndex + ") ";

    let selEditDetails = selDetails + ".detailText";
    try {
      browser.waitForVisible(selEditDetails);
    } catch (e) {
      console.log("detailText not visible");
      return false;
    }
    E2EGlobal.clickWithRetry(selEditDetails);

    let selFocusedInput = selDetails + ".detailInput";
    try {
      browser.waitForVisible(selFocusedInput);
    } catch (e) {
      return false;
    }
    E2EGlobal.setValueSafe(selFocusedInput, detailsText);
    browser.keys(["Tab"]);
  }

  static getTopicsForMinute() {
    let selector = "#topicPanel > div.well";
    try {
      browser.waitForExist(selector);
    } catch (e) {
      return 0;
    }
    const elements = browser.elements(selector);
    return elements.value;
  }

  static countTopicsForMinute() {
    let topics = E2ETopics.getTopicsForMinute();
    return topics.length ? topics.length : 0;
  }

  static getLastTopicForMinute() {
    let topics = E2ETopics.getTopicsForMinute();
    return topics[topics.length - 1];
  }

  static getItemsForTopic(topicIndexOrSelectorForParentElement) {
    let parentSel = topicIndexOrSelectorForParentElement;
    if (!isNaN(parentSel)) {
      parentSel =
        "#topicPanel .well:nth-child(" +
        topicIndexOrSelectorForParentElement +
        ")";
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

  static countItemsForTopic(topicIndex) {
    let items = E2ETopics.getItemsForTopic(topicIndex);
    return items.length;
  }

  static getDetailsForItem(topicIndex, infoItemIndex) {
    let selectInfoItem = E2ETopics.getInfoItemSelector(
      topicIndex,
      infoItemIndex,
    );

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
