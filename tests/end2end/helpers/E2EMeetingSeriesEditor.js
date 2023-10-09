import { E2EGlobal } from "./E2EGlobal";
import { E2EMeetingSeries } from "./E2EMeetingSeries";

export class E2EMeetingSeriesEditor {
  static openMeetingSeriesEditor(
    aProj,
    aName,
    panelName = "base",
    skipGotoMeetingSeries,
  ) {
    // Maybe we can save "gotoStartPage => gotoMeetingSeries"?
    if (!skipGotoMeetingSeries) {
      E2EMeetingSeries.gotoMeetingSeries(aProj, aName);
    }

    // Open dialog
    browser.waitForVisible("#btnEditMeetingSeries", 1000);
    E2EGlobal.clickWithRetry("#btnEditMeetingSeries", 3000);

    // Check if dialog is there?
    browser.waitForVisible("#btnMeetingSeriesSave", 3000);
    E2EGlobal.clickWithRetry("#btnShowHideBaseConfig", 3000);
    E2EGlobal.waitSomeTime(); // give dialog animation time

    if (!(panelName && panelName !== "base")) {
      return;
    }
    let panelSelector = "";
    if (panelName === "invited") {
      panelSelector = "#btnShowHideInvitedUsers";
    } else if (panelName === "labels") {
      panelSelector = "#btnShowHideLabels";
    } else {
      throw `Unsupported panelName: ${panelName}`;
    }
    browser.waitForExist(panelSelector);
    E2EGlobal.clickWithRetry(panelSelector);
    E2EGlobal.waitSomeTime(); // wait for panel animation
  }

  // assumes an open meeting series editor
  static addUserToMeetingSeries(username, role) {
    browser.setValue("#edt_AddUser", username);
    browser.keys(["Enter"]);

    if (!role) {
      return;
    }
    //Get Index of user's row in table
    let index = browser.execute((username) => {
      return $(`tr:contains('${username}')`).index();
    }, username).value;
    index += 1; //increase by one since nth-child will start by 1 whereas index starts by 0
    const selector = `tr:nth-child(${index}) select.user-role-select`;
    browser.selectByValue(selector, role);
  }

  static closeMeetingSeriesEditor(save = true) {
    const selector = save
      ? "#btnMeetingSeriesSave"
      : "#btnMeetinSeriesEditCancel";
    E2EGlobal.clickWithRetry(selector);
    E2EGlobal.waitSomeTime(save ? 750 : 300);
  }

  /**
     * Analyze the user editor table in the DOM and generate a dictionary with its content
     *
     * Example result:
     { user1:
        { role: 'Moderator',
          isReadOnly: true,
          isDeletable: false,
          deleteElemId: '0' },
       user2:
        { role: 'Invited',
          isReadOnly: false,
          isDeletable: true,
          deleteElemId: '236' } }
     *
     * @param colNumUser    in which 0-based table column is the user name?
     * @param colNumRole    in which 0-based table column is the role text/ role <select>?
     * @param colNumDelete  in which 0-based table column is the delete button?
     * @returns {{}}
     */
  static getUsersAndRoles(colNumUser, colNumRole, colNumDelete) {
    // grab all user rows
    const elementsUserRows = browser.elements("#id_userRow");
    const usersAndRoles = {};

    const selector = "select.user-role-select"; // selects *all* <selects>
    // browser.getValue(selector) delivers *all* current selections => e.g. ["Moderator","Invited","Invited"]
    // except for the current user, who has no <select>
    let usrRoleSelected = [];
    // ensure we get an array here - even in case only one value returned from getValue()!
    try {
      usrRoleSelected = usrRoleSelected.concat(browser.getValue(selector));
    } catch (e) {}

    let selectNum = 0;
    // the "current user" is read-only and has no <select>
    // we must skip this user in the above usrRoleSelected
    for (const rowIndex in elementsUserRows.value) {
      const elemTRId = elementsUserRows.value[rowIndex].ELEMENT;
      const elementsTD = browser.elementIdElements(elemTRId, "td");
      const usrName = browser.elementIdText(
        elementsTD.value[colNumUser].ELEMENT,
      ).value;
      const elementsDelete = browser.elementIdElements(
        elementsTD.value[colNumDelete].ELEMENT,
        "#btnDeleteUser",
      );
      const usrIsDeletable = elementsDelete.value.length === 1;
      const usrDeleteElemId = usrIsDeletable
        ? elementsDelete.value[0].ELEMENT
        : "0";

      // for the current user usrRole already contains his read-only role string "Moderator"
      let usrRole = browser.elementIdText(
        elementsTD.value[colNumRole].ELEMENT,
      ).value;
      let usrIsReadOnly = true;

      // For all other users we must get their role from the usrRoleSelected array
      // Here we try to find out, if we look at a <select> UI element...
      // Chrome: with '\n' linebreaks we detect a <select> for this user!
      // Phantom.js: Has no linebreaks between <option>s, it just concatenates like "InvitedModerator"
      // so we go for "usrRole.length>10" to detect a non-possible role text...
      if (usrRole.indexOf("\n") >= 0 || usrRole.length > 10) {
        usrRole = usrRoleSelected[selectNum];
        usrIsReadOnly = false;
        selectNum++;
      }

      usersAndRoles[usrName] = {
        role: usrRole,
        isReadOnly: usrIsReadOnly,
        isDeletable: usrIsDeletable,
        deleteElemId: usrDeleteElemId,
      };
    }
    // console.log(usersAndRoles);

    return usersAndRoles;
  }

  static changeLabel(
    labelName,
    newLabelName,
    newLabelColor,
    autoSaveLabelChange = true,
  ) {
    const labelId = E2EMeetingSeriesEditor.getLabelId(labelName);
    const selLabelRow = `#row-label-${labelId}`;

    // open label editor for labelId
    E2EGlobal.clickWithRetry(`${selLabelRow} .evt-btn-edit-label`);

    browser.setValue(`${selLabelRow} [name='labelName']`, newLabelName);
    if (newLabelColor) {
      browser.setValue(
        `${selLabelRow} [name='labelColor-${labelId}']`,
        newLabelColor,
      );
    }

    if (autoSaveLabelChange) {
      E2EGlobal.clickWithRetry(`${selLabelRow} .evt-btn-edit-save`);

      E2EMeetingSeriesEditor.closeMeetingSeriesEditor();
    }

    return labelId;
  }

  static getLabelId(labelName) {
    // get all label elements
    browser.waitForExist("#table-edit-labels .label");
    const elements = browser.elements("#table-edit-labels .label").value;

    for (const elementID of elements) {
      const element = browser.elementIdText(elementID.ELEMENT);
      if (labelName === element.value) {
        return browser.elementIdAttribute(elementID.ELEMENT, "id").value;
      }
    }
  }

  static disableEmailForRoleChange() {
    browser.waitForVisible("#labelRoleChange");
    E2EGlobal.clickWithRetry("#labelRoleChange");
  }
}
