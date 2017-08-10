import {E2EGlobal} from './E2EGlobal';

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
        return ! E2EMinutesParticipants.isExpanded();
    }

    static expand() {
        if (E2EMinutesParticipants.isCollapsed()) {
            browser.click("#btnParticipantsExpand");
            browser.waitForVisible('#id_participants');
        }
    }

    static collapse() {
        if (E2EMinutesParticipants.isExpanded()) {
            browser.click("#btnParticipantsExpand");

            const waitForInvisible = true;
            browser.waitForVisible('#id_participants', 10000, waitForInvisible);
        }
    }

    static getPresentParticipantsFromServer(minutesId) {
        try {
            return server.call('e2e.getPresentParticipantNames', minutesId);
        } catch (e) {
            console.log("Exception: "+e);
            console.log("Did you forget to run the server with '--settings settings-test-end2end.json'?");
        } 
        return undefined;
    }



    // ******************** NON-STATIC Methods

    /*  updateUsersAndPresence()
        updates this._participantsAndPresence from the current browser DOM.
        E.g., to something like this:
         {
             "##additional participants##": "Max Mustermann and some other guys",
             "user1": {
                 "present": false,
                 "checkboxElemId": "700",
                 "userElemId": "697"
             },
             "user2": {
                 "present": true,
                 "checkboxElemId": "701",
                 "userElemId": "698"
             },
         }
     */
    updateUsersAndPresence() {
        E2EMinutesParticipants.expand();

        this._participantsAndPresence = {};
        try {
            this._participantsAndPresence["##additional participants##"] = browser.getValue('#edtParticipantsAdditional');
        } catch(e) {
            this._participantsAndPresence["##additional participants##"] = "";
        }

        const participants = browser.elements('#id_participant #id_username');
        const presence = browser.elements('input#btnTogglePresent');

        for (let participantIndex in participants.value) {
            let username = browser.elementIdText(participants.value[participantIndex].ELEMENT).value;
            let checkboxId = presence.value[participantIndex].ELEMENT;
            this._participantsAndPresence[username] = {
                present: browser.elementIdSelected(checkboxId).value,
                checkboxElemId: checkboxId,
                userElemId: participants.value[participantIndex].ELEMENT
            };
        }
    }

    getParticipantsCount () {
        // "-1" to skip this._participantsAndPresence["##additional participants##"]
        return Object.keys(this._participantsAndPresence).length -1
    }

    getParticipantInfo(username) {
        return this._participantsAndPresence[username];
    }
    
    getAdditionalParticipants() {
        return this._participantsAndPresence["##additional participants##"];
    }

    setUserPresence(username, presence) {
        let currentSelectState = browser.elementIdSelected(this._participantsAndPresence[username].checkboxElemId).value;
        if (currentSelectState != presence) {
            browser.elementIdClick(this._participantsAndPresence[username].userElemId)
        }
        this.updateUsersAndPresence();
    }
    
    
}
