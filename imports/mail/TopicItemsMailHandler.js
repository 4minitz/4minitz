
import { TemplateRenderer } from './../server_side_templates/TemplateRenderer'
import { MailFactory } from './MailFactory'

export class TopicItemsMailHandler {

    constructor(sender, recipient, minute, templateName) {
        this._recipient = recipient;
        this._sender = sender;
        this._minute = minute;
        this._templateName = templateName;
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
        return (new TemplateRenderer(this._templateName, 'server_templates/email')).addData('name', this._recipient);
    }

    _getMailer() {
        if (!this._mailer) {
            this._mailer = MailFactory.getMailer(this._sender, this._recipient);
        }
        return this._mailer;
    }

}