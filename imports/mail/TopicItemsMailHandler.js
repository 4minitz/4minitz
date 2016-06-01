
import { TemplateRenderer } from './../server_side_templates/TemplateRenderer'
import { MailFactory } from './MailFactory'

export class TopicItemsMailHandler {

    constructor(sender, recipients, minute, templateName) {
        this._recipients = recipients;
        this._sender = sender;
        this._minute = minute;
        this._templateName = templateName;
        this._currentRecipient = "";
    }

    send() {
        this._recipients.forEach((recipient) => {
            this._currentRecipient = recipient;
            this._sendMail();
            this._mailer = null;
        })
    }

    _sendMail() {
        throw new Meteor.Error('illegal-state', 'abstract method _sendMail not implemented.');
    }

    _getCurrentMailAddress() {
        return (typeof this._currentRecipient === 'string')
                ? this._currentRecipient
                : this._currentRecipient.address;
    }

    _getSubjectPrefix() {
        return "[" + this._minute.parentMeetingSeries().project + "] "
            + this._minute.parentMeetingSeries().name + " on "
            + this._minute.date;
    }

    _buildMail(subject, emailData) {
        this._getMailer().setSubject(subject);
        let tmplRenderer = this._getTmplRenderer();
        tmplRenderer.addDataObject(emailData);
        this._getMailer().setHtml(tmplRenderer.render());
        this._getMailer().send();
    }

    _getTmplRenderer() {
        let recipientsName = (typeof this._currentRecipient === 'string')
            ? this._currentRecipient
            : this._currentRecipient.name;
        return (new TemplateRenderer(this._templateName, 'server_templates/email')).addData('name', recipientsName);
    }

    _getMailer() {
        if (!this._mailer) {
            this._mailer = MailFactory.getMailer(this._sender, this._getCurrentMailAddress());
        }
        return this._mailer;
    }

}