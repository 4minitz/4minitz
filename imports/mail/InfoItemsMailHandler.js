import { User } from "/imports/user";
import { i18n } from "meteor/universe:i18n";

import { DocumentGeneration } from "../documentGeneration";

import { TopicItemsMailHandler } from "./TopicItemsMailHandler";

export class InfoItemsMailHandler extends TopicItemsMailHandler {
  constructor(
    sender,
    recipients,
    minute,
    topics,
    meetingSeries,
    participants,
    informed,
    template = "publishInfoItems",
  ) {
    super(sender, recipients, minute, template);
    this._topics = topics;
    this._sender = sender;
    this._minute = minute;
    this._meetingSeries = meetingSeries;
    this._participants = participants;
    this._informed = informed;
  }

  _getSubject() {
    return `${this._getSubjectPrefix()} (${i18n.__(
      "Mail.minutesSubject",
    )} ${i18n.__("Minutes.versionTag")}${this._minute.finalizedVersion})`;
  }

  _sendMail(mailData) {
    if (mailData === undefined)
      mailData = DocumentGeneration.getDocumentData(this);
    const mailSubject = this._getSubject();

    DocumentGeneration.generateResponsibleStringsForTopic(this);

    this._buildMail(mailSubject, mailData);
  }

  _userArrayToString(users) {
    return users.map((user) => User.PROFILENAMEWITHFALLBACK(user)).join("; ");
  }
}
