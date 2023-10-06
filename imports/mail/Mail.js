import { Meteor } from "meteor/meteor";

import { GlobalSettings } from "../config/GlobalSettings";

export class Mail {
  /**
   *
   * @param replyTo {string}
   * @param recipients {string|string[]}
   */
  constructor(replyTo, recipients) {
    this._replyTo = replyTo;
    this._recipients = recipients;
    this._from = GlobalSettings.getDefaultEmailSenderAddress(
      /*alternative:*/ replyTo,
    );
  }

  setSubject(subject) {
    this._subject = subject;
  }

  setText(text) {
    this._text = text;
  }

  setHtml(html) {
    this._html = html;
  }

  send() {
    if (!this._text && !this._html) {
      throw new Meteor.Error(
        "invalid-state",
        "You must set either html or text as email content",
      );
    }
    try {
      this._sendMail();
    } catch (error) {
      console.log(
        `#Email could not be sent successfully to: ${this._recipients}`,
      );
      console.log(`\tEmail subject: ${this._subject}`);
      console.log(`\tError: ${error}`);
      return;
    }

    console.log(`#Email was sent successfully to: ${this._recipients}`);
    console.log(`\tEmail subject: ${this._subject}`);
  }

  _sendMail() {
    throw new Meteor.Error(
      "not-implemented",
      "This method must be implemented by the concrete Mail class",
    );
  }
}
