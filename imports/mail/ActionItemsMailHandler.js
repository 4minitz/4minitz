import { TopicItemsMailHandler } from './TopicItemsMailHandler'
import { ActionItem } from '../actionitem'

export class ActionItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipient, minute) {
        super(sender, [recipient], minute, 'assignedActionItems');
        this._actionItems = [];
        this._sendSeparateMails = false;
    }

    addActionItem(actionItem) {
        this._actionItems.push(actionItem);
    }

    _sendMail() {
        if (this._sendSeparateMails) {
            this._actionItems.forEach(item => {
                let topicSubject = item.getParentTopic().getSubject();
                let mailSubject = this._getSubjectPrefix() + " / " + topicSubject;

                this._buildMail(
                    mailSubject,
                    {
                        'actionItems': [ActionItemsMailHandler._createActionItemDataObject(topicSubject, item)]
                    }
                );
            });
        } else {
            let mailSubject = this._getSubjectPrefix() + " / your action items";
            this._buildMail(
                mailSubject,
                {
                    'actionItems': this._actionItems.map(item => {
                        let topicSubject = item.getParentTopic().getSubject();
                        return ActionItemsMailHandler._createActionItemDataObject(topicSubject, item);
                    })
                }
            );
        }
    }

    static _createActionItemDataObject(topicSubject, item) {
        // prevent sending empty details
        let details = (item.getTextFromDetails() === "") ? [] : item.getDetails();

        return {
            topicSubject: topicSubject,
            subject: item.getSubject(),
            responsible: item.getResponsibleString(),
            priority: item.getPriority(),
            duedate: item.getDuedate(),
            details: details
        }
    }

}