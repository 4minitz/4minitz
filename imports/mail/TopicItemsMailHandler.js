
import { TemplateRenderer } from './../server_side_templates/TemplateRenderer'
import { MailFactory } from './MailFactory'
import { GlobalSettings } from './../GlobalSettings'
import { InfoItemFactory } from '../InfoItemFactory'
import { Topic } from '../topic'

export class TopicItemsMailHandler {

    constructor(sender, recipients, minute, templateName) {
        this._recipients = recipients;
        this._sender = sender;
        this._minute = minute;
        this._templateName = templateName;
        this._currentRecipient = "";
        this._sendOneMailToAllRecipients = GlobalSettings.isTrustedIntranetInstallation();
    }

    send() {
        if (this._sendOneMailToAllRecipients) {
            this._currentRecipient = this._recipients;
            this._sendMail();
            this._mailer = null;
        } else {
            this._recipients.forEach((recipient) => {
                this._currentRecipient = recipient;
                this._sendMail();
                this._mailer = null;
            });
        }
    }

    _sendMail() {
        throw new Meteor.Error('illegal-state', 'abstract method _sendMail not implemented.');
    }

    _getCurrentMailAddress() {
        if (typeof this._currentRecipient === 'string') {
            return this._currentRecipient;
        } else if (this._currentRecipient.hasOwnProperty('address')) {
            return this._currentRecipient.address;
        } else {
            // we should send the mail to multiple recipients -> return array of strings
            return this._currentRecipient.map(recipient => {
                return (typeof recipient === 'string')
                    ? recipient
                    : recipient.address;
            })
        }
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
        let context = this;
        tmplRenderer.addHelper('hasLabels', function() {
            return (this.labels.length > 0);
        });
        tmplRenderer.addHelper('formatLabels', function(parentTopicId) {
            let parentTopic = new Topic(context._minute, parentTopicId);
            let infoItemId = this._id;
            let infoItem = InfoItemFactory.createInfoItem(parentTopic, infoItemId);
            let labels = infoItem.getLabels(context._minute.parentMeetingSeriesID());
            let result = '';
            let first = true;
            labels.forEach(label => {
                if (first) {
                    first = false;
                } else {
                    result += ', ';
                }
                result += label.getName();
            });
            return result;
        });
        this._getMailer().setHtml(tmplRenderer.render());
        this._getMailer().send();
    }

    _getTmplRenderer() {
        let recipientsName = (this._currentRecipient.hasOwnProperty('name'))
            ? this._currentRecipient.name
            : "";
        return (new TemplateRenderer(this._templateName, 'server_templates/email')).addData('name', recipientsName);
    }

    _getMailer() {
        if (!this._mailer) {
            this._mailer = MailFactory.getMailer(this._sender, this._getCurrentMailAddress());
        }
        return this._mailer;
    }

}