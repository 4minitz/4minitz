import { i18n } from "meteor/universe:i18n";

import { ResponsibleResolver } from "../services/responsibleResolver";

import { TopicItemsMailHandler } from "./TopicItemsMailHandler";

export class ActionItemsMailHandler extends TopicItemsMailHandler {
  constructor(sender, recipient, minute) {
    super(sender, [recipient], minute, "assignedActionItems");
    this._actionItems = [];
    this._sendAIseperately = false;
  }

  addActionItem(actionItem) {
    this._actionItems.push(actionItem);
  }

  _getSubject() {
    return `${this._getSubjectPrefix()} (${i18n.__("Item.Filter.yourAction")})`;
  }

  _sendMail() {
    if (this._sendAIseperately) {
      this._actionItems.forEach((item) => {
        const topicSubject = item.getParentTopic().getSubject();
        const mailSubject = `${this._getSubject()}: ${topicSubject}`;

        this._buildMail(mailSubject, {
          greetingLabel: i18n.__("Mail.greeting"),
          newLabel: i18n.__("Mail.newActionItem"),
          actionItems: [
            ActionItemsMailHandler._createActionItemDataObject(
              topicSubject,
              item.getParentTopic()._topicDoc._id,
              item,
            ),
          ],
        });
      });
    } else {
      const mailSubject = this._getSubject();
      this._buildMail(mailSubject, {
        greetingLabel: i18n.__("Mail.greeting"),
        newLabel: i18n.__("Mail.newActionItem"),
        actionItems: this._actionItems.map((item) => {
          const topicSubject = item.getParentTopic().getSubject();
          return ActionItemsMailHandler._createActionItemDataObject(
            topicSubject,
            item.getParentTopic()._topicDoc._id,
            item,
          );
        }),
      });
    }
  }

  static _createActionItemDataObject(topicSubject, topicId, item) {
    // prevent sending empty details
    const details = item.getTextFromDetails() === "" ? [] : item.getDetails();

    return {
      _id: item.getDocument()._id,
      topicLabel: i18n.__("Topic.title"),
      topicId,
      topicSubject,
      itemSubject: item.getSubject(),
      labelsLabel: i18n.__("MeetingSeries.Edit.labels"),
      labels: item.getLabelsRawArray(),
      responsibleLabel: i18n.__("Topic.responsible"),
      responsibles: ResponsibleResolver.resolveAndformatResponsiblesString(
        item.getResponsibleRawArray(),
      ),
      priorityLabel: i18n.__("Item.priority"),
      priority: item.getPriority(),
      dueLabel: i18n.__("Item.due"),
      duedate: item.getDuedate(),
      dueNoneLabel: i18n.__("Item.dueNone"),
      detailsLabel: i18n.__("Item.details"),
      details,
    };
  }
}
