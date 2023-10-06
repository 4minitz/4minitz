import { Mongo } from "meteor/mongo";
import { Mail } from "./Mail";

export const TestMailCollection = new Mongo.Collection("testemails");

export class TestMail extends Mail {
  constructor(replyTo, recipient) {
    super(replyTo, recipient);
  }

  _sendMail() {
    const config = {
      to: this._recipients,
      from: this._from,
      replyTo: this._replyTo,
      subject: this._subject,
    };

    if (this._text) {
      config.text = this._text;
    }
    if (this._html) {
      config.html = this._html;
    }

    TestMailCollection.insert(config);
  }
}
