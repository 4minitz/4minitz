import { ActionItemMailHandler } from './ActionItemMailHandler'

import { Minutes } from './../minutes'
import { ActionItem } from './../actionitem'

export class FinalizeMailHandler {

    constructor(minute) {
        if (!minute) {
            throw new Meteor.Error('illegal-argument', 'Minute id or object required');
        }
        if (typeof minute === 'string') {   // we may have an ID here.
            minute = new Minutes(minute);
        }

        this._minute = minute;
    }

    sendMails() {
        this._sendActionItems();
        //todo: this._sendProtocol();
    }

    _sendActionItems() {
        let actionItems = this._minute.getOpenActionItems();
        actionItems.forEach(item => {
            (new ActionItemMailHandler(item)).send();
        })
    }
}