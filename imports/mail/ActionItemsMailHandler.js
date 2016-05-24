import { ActionItem } from '../actionitem'
import { MeteorMail } from './MeteorMail'
import { TemplateRenderer } from './../server_side_templates/TemplateRenderer'

export class ActionItemsMailHandler {

    constructor(sender, recipient, minute) {
        this._actionItems = [];
        this._sendSeparateMails = false;
        this._recipient = recipient;
        this._sender = sender;
        this._minute = minute;
    }

    addActionItem(actionItem) {
        this._actionItems.push(actionItem);
    }

    send() {
        if (this._sendSeparateMails) {
            this._actionItems.forEach(item => {
                let topicSubject = item.getParentTopic().getSubject();
                let mailSubject = this._getSubjectPrefix() + " / " + topicSubject;

                this._buildMail(
                    mailSubject,
                    [ActionItemsMailHandler._createActionItemDataObject(topicSubject, item)]
                );
            });
        } else {
            let mailSubject = this._getSubjectPrefix() + " / your action items";
            this._buildMail(
                mailSubject,
                this._actionItems.map(item => {
                    let topicSubject = item.getParentTopic().getSubject();
                    return ActionItemsMailHandler._createActionItemDataObject(topicSubject, item);
                })
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

    _getSubjectPrefix() {
        return "[" + this._minute.parentMeetingSeries().project + "] "
            + this._minute.parentMeetingSeries().name + " on "
            + this._minute.date;
    }

    _buildMail(subject, actionItemsData) {
        this._getMailer().setSubject(subject);
        let tmplRenderer = this._getTmplRenderer();
        tmplRenderer.addData('actionItems', actionItemsData);
        this._getMailer().setHtml(tmplRenderer.render());
        this._getMailer().send();
    }

    _getTmplRenderer() {
        return (new TemplateRenderer('assignedActionItems', 'server_templates/email')).addData('name', this._recipient);
    }

    _getMailer() {
        if (!this._mailer) {
            this._mailer = new MeteorMail(this._sender, this._recipient);
        }
        return this._mailer;
    }

}