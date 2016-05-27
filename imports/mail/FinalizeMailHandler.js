import { ActionItemsMailHandler } from './ActionItemsMailHandler'
import { Minutes } from './../minutes'
import { ActionItem } from './../actionitem'

export class FinalizeMailHandler {

    constructor(minute, senderAddress) {
        if (!minute) {
            throw new Meteor.Error('illegal-argument', 'Minute id or object required');
        }
        if (!senderAddress) {
            throw new Meteor.Error('illegal-argument', 'sender address required');
        }
        if (typeof minute === 'string') {   // we may have an ID here.
            minute = new Minutes(minute);
        }

        this._minute = minute;
        this._senderAddress = senderAddress;
    }

    sendMails(sendActionItems = true, sendInfoItems = true) {
        if (sendActionItems) {
            this._sendActionItems();
        }
        if (sendInfoItems) {
            //todo: this._InfoItems();
        }
    }

    _sendActionItems() {
        // create map recipient->mailHandler and add all AIs to the
        // mail handler for this recipient
        let userMailHandlerMap = new Map();
        let actionItems = this._minute.getOpenActionItems();
        actionItems.forEach(item => {
            item.getResponsibleArray().forEach(recipient => {
                if (!userMailHandlerMap.has(recipient)) {
                    userMailHandlerMap.set(
                        recipient,
                        new ActionItemsMailHandler(
                            this._senderAddress,
                            recipient,
                            this._minute
                        )
                    );
                }
                userMailHandlerMap.get(recipient).addActionItem(item);
            });
        });

        // iterate over all mail handler and send the mails
        for(let mailHandler of userMailHandlerMap.values()) {
            mailHandler.send();
        }
    }
}