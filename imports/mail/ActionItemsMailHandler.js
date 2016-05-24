import { ActionItem } from '../actionitem'
import { MeteorMail } from './MeteorMail'

export class ActionItemsMailHandler {

    constructor(sender, recipient, meetingSeriesName) {
        this._actionItems = [];
        this._sendSeparateMails = false;
        this._recipient = recipient;
        this._sender = sender;
        this._meetingSeriesName = meetingSeriesName;
    }

    addActionItem(actionItem) {
        this._actionItems.push(actionItem);
    }

    send() {
        this._actionItems.forEach(item => {
            this._getMailer().setSubject(this._meetingSeriesName + " - " + item.getParentTopic().getSubject());
            this._getMailer().setText("Hello " + this._recipient + " your action item: " + item);
            this._getMailer().send();
        });
    }

    _getMailer() {
        if (!this._mailer) {
            this._mailer = new MeteorMail(this._sender, this._recipient);
        }
        return this._mailer;
    }

}