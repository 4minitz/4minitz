import { E2EGlobal } from "./E2EGlobal";

export class E2EMinutesParticipants {
  constructor() {
    this.updateUsersAndPresence();
  }

  // ******************** STATIC Methods
  static isExpanded() {
    E2EGlobal.waitSomeTime(750);
    return browser.isExisting("#edtParticipantsAdditional");
  }

  static isCollapsed() {
    return !E2EMinutesParticipants.isExpanded();
  }

  static expand() {
    if (E2EMinutesParticipants.isCollapsed()) {
      E2EGlobal.clickWithRetry("#btnParticipantsExpand");
      browser.waitForVisible("#id_participants");
    }
  }

  static collapse() {
    if (E2EMinutesParticipants.isExpanded()) {
      E2EGlobal.clickWithRetry("#btnParticipantsExpand");

      const waitForInvisible = true;
      browser.waitForVisible("#id_participants", 10000, waitForInvisible);
    }
  }

  static getPresentParticipantsFromServer(minutesId) {
    try {
      return server.call("e2e.getPresentParticipantNames", minutesId);
    } catch (e) {
      console.log(`Exception: ${e}`);
      console.log(
        "Did you forget to run the server with '--settings settings-test-end2end.json'?",
      );
    }
    return undefined;
  }

  // ******************** NON-STATIC Methods

  /*  updateUsersAndPresence()
        updates this._participantsAndPresence from the current browser DOM.
        E.g., to something like this:
         {
             "##additional participants##": "Max Mustermann and some other
     guys", "user1": { "present": false, "checkboxElem": {...}, "userElem":
     "{...}
             },
             "user2": {
                 "present": true,
                 "checkboxElem": {...},
                 "userElem": {...}
             },
         }
     */
  updateUsersAndPresence() {
    // scroll to top to make sure the page will not scroll if any element
    // disappears (e.g. item input field)
    browser.scrollXY(0, 0);
    E2EMinutesParticipants.expand();

    this._participantsAndPresence = {};
    try {
      this._participantsAndPresence["##additional participants##"] = $(
        "#edtParticipantsAdditional",
      ).getValue();
    } catch (e) {
      this._participantsAndPresence["##additional participants##"] = "";
    }

    const participants = $$(".js-participant-checkbox #id_username");
    const presence = $$("input.js-toggle-present");

    for (
      let participantIndex = 0;
      participantIndex < participants.length;
      participantIndex++
    ) {
      const username = participants[participantIndex].getText();
      const userElem = participants[participantIndex];
      const checkboxElem = presence[participantIndex];

      this._participantsAndPresence[username] = {
        present: checkboxElem.isSelected(),
        checkboxElem,
        userElem,
      };
    }
  }

  getParticipantsCount() {
    // "-1" to skip this._participantsAndPresence["##additional participants##"]
    return Object.keys(this._participantsAndPresence).length - 1;
  }

  getParticipantInfo(username) {
    return this._participantsAndPresence[username];
  }

  getAdditionalParticipants() {
    return this._participantsAndPresence["##additional participants##"];
  }

  setUserPresence(username, presence) {
    if (!this._participantsAndPresence[username]) {
      return false;
    }
    const currentSelectState =
      this._participantsAndPresence[username].checkboxElem.isSelected();
    if (currentSelectState !== presence) {
      browser.scroll("#id_participants");
      this._participantsAndPresence[username].userElem.click();
    }
    this.updateUsersAndPresence();
    return true;
  }
}
