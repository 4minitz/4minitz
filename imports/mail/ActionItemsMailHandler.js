import { ActionItem } from '../actionitem'

export class ActionItemsMailHandler {

    constructor(recipient) {
        this._actionItems = [];
        this._sendSeparateMails = false;
        this._recipient = recipient;
    }

    addActionItem(actionItem) {
        this._actionItems.push(actionItem);
    }

    send() {
        this._actionItems.forEach(item => {
            console.log("Send mail to: " + this._recipient + " action item: " + item);
        });
    }

}