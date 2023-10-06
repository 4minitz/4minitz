import { Meteor } from "meteor/meteor";

import { GlobalSettings } from "../config/GlobalSettings";

import { MailgunMail } from "./MailgunMail";
import { MeteorMail } from "./MeteorMail";
import { TestMail } from "./TestMail";

export class MailFactory {
  static getMailer(replyTo, recipients) {
    const deliverer = GlobalSettings.getMailDeliverer();
    switch (deliverer) {
      case "mailgun":
        return new MailgunMail(replyTo, recipients);
      case "smtp":
        return new MeteorMail(replyTo, recipients);
      case "test":
        return new TestMail(replyTo, recipients);
      default:
        throw new Meteor.Error(
          "illegal-state",
          `Unknown mail deliverer: ${deliverer}`,
        );
    }
  }
}
