import { TopicItemsMailHandler } from './TopicItemsMailHandler'
import { ActionItem } from '../actionitem'

export class ActionItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipient, minute) {
        super(sender, [recipient], minute, 'assignedActionItems');
        this._actionItems = [];
        this._sendAIseperately = false;
    }

    addActionItem(actionItem) {
        this._actionItems.push(actionItem);
    }

    _getSubject() {
        return this._getSubjectPrefix() + " (Your Action Items)";
    }

    _sendMail() {
        if (this._sendAIseperately) {
            this._actionItems.forEach(item => {
                let topicSubject = item.getParentTopic().getSubject();
                let mailSubject = this._getSubject()+": " + topicSubject;

                this._buildMail(
                    mailSubject,
                    {
                        'actionItems': [ActionItemsMailHandler._createActionItemDataObject(topicSubject, item.getParentTopic()._topicDoc._id, item)]
                    }
                );
            });
        } else {
            let mailSubject = this._getSubject();
            this._buildMail(
                mailSubject,
                {
                    'actionItems': this._actionItems.map(item => {
                        let topicSubject = item.getParentTopic().getSubject();
                        return ActionItemsMailHandler._createActionItemDataObject(topicSubject, item.getParentTopic()._topicDoc._id, item);
                    })
                }
            );
        }
    }

    static _createActionItemDataObject(topicSubject, topicId, item) {
        // prevent sending empty details
        let details = (item.getTextFromDetails() === "") ? [] : item.getDetails();

        return {
            _id: item.getDocument()._id,
            topicId: topicId,
            topicSubject: topicSubject,
            itemSubject: item.getSubject(),
            labels: item.getLabelsRawArray(),
            responsibles: item.getResponsibleNameString(),
            priority: item.getPriority(),
            duedate: item.getDuedate(),
            details: details
        }
    }

}