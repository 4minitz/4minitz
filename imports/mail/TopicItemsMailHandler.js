import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";
import { TemplateRenderer } from "./../server_side_templates/TemplateRenderer";
import { MailFactory } from "./MailFactory";
import { GlobalSettings } from "../config/GlobalSettings";
import { DocumentGeneration } from "../documentGeneration";

export class TopicItemsMailHandler {
  constructor(sender, recipients, minute, templateName) {
    this._recipients = recipients;
    this._sender = sender;
    this._minute = minute;
    this._templateName = templateName;
    this._currentRecipient = "";
    this._sendOneMailToAllRecipients =
      GlobalSettings.isTrustedIntranetInstallation();
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
    throw new Meteor.Error(
      "illegal-state",
      "abstract method _sendMail not implemented.",
    );
  }

  _getCurrentMailAddress() {
    if (typeof this._currentRecipient === "string") {
      return this._currentRecipient;
    } else if (
      Object.prototype.hasOwnProperty.call(this._currentRecipient, "address")
    ) {
      return this._currentRecipient.address;
    } else {
      // we should send the mail to multiple recipients -> return array of strings
      return this._currentRecipient.map((recipient) => {
        return typeof recipient === "string" ? recipient : recipient.address;
      });
    }
  }

  _getSubject() {
    return this._getSubjectPrefix();
  }

  _getSubjectPrefix() {
    return (
      "[" +
      this._minute.parentMeetingSeries().project +
      "] " +
      this._minute.parentMeetingSeries().name +
      " " +
      i18n.__("Minutes.dateOn") +
      " " +
      this._minute.date
    );
  }

  _buildMail(subject, emailData) {
    this._getMailer().setSubject(subject);
    let tmplRenderer = this._getTmplRenderer();
    tmplRenderer.addDataObject(emailData);
    DocumentGeneration.addHelperForHTMLMail(tmplRenderer, this);

    this._getMailer().setHtml(tmplRenderer.render());
    this._getMailer().send();
  }

  _getTmplRenderer() {
    let recipientsName = Object.prototype.hasOwnProperty.call(
      this._currentRecipient,
      "name",
    )
      ? this._currentRecipient.name
      : "";
    return new TemplateRenderer(
      this._templateName,
      "server_templates/email",
    ).addData("name", recipientsName);
  }

  _getMailer() {
    if (!this._mailer) {
      this._mailer = MailFactory.getMailer(
        this._sender,
        this._getCurrentMailAddress(),
      );
    }
    return this._mailer;
  }
}
