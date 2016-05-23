import { ActionItem } from '../actionitem'

export class ActionItemMailHandler {

    /**
     *
     * @param actionItem ActionItem
     */
    constructor(actionItem) {
        this.actionItem = actionItem;
    }

    send() {
        console.log("Send mail to: " + this.actionItem._infoItemDoc.responsible + " action item: " + this.actionItem);
    }

}