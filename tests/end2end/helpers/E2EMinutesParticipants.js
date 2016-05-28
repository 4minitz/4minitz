
import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp'
import { E2EMeetingSeries } from './E2EMeetingSeries'


export class E2EMinutesParticipants {
    
    constructor() {
        this.updateUsersAndPresence();
    }

    updateUsersAndPresence() {
        this._participantsAndPresence = {};
        this._participantsAndPresence["##additional participants##"] = browser.getValue('#edtParticipantsAdditional');

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

        console.log("JSON: "+JSON.stringify(this._participantsAndPresence,null,2));
    }

    getParticipantsCount () {
        // -1: skip this._participantsAndPresence["##additional participants##"] 
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
