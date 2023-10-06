import { Meteor } from "meteor/meteor";

import { ActionItemsMailHandler } from "./ActionItemsMailHandler";
import { InfoItemsMailHandler } from "./InfoItemsMailHandler";
import { Minutes } from "./../minutes";
import { ResponsibleResolver } from "../services/responsibleResolver";

export class FinalizeMailHandler {
  constructor(minute, senderAddress) {
    if (!minute) {
      throw new Meteor.Error(
        "illegal-argument",
        "Minute id or object required",
      );
    }
    if (!senderAddress) {
      throw new Meteor.Error("illegal-argument", "sender address required");
    }
    if (typeof minute === "string") {
      // we may have an ID here.
      minute = new Minutes(minute);
    }

    this._minute = minute;
    this._senderAddress = senderAddress;
  }

  sendMails(sendActionItems = true, sendInfoItems = true) {
    if (sendActionItems) {
      this._sendActionItems();
    }
    if (sendInfoItems) {
      this._sendInfoItems();
    }
  }

  _sendActionItems() {
    // create map recipient->mailHandler and add all AIs to the
    // mail handler for this recipient
    const userMailHandlerMap = new Map();
    const actionItems = this._minute.getOpenActionItems(false); // false-parameter makes skipped Topics being not included in the Mail
    actionItems.forEach((item) => {
      const recipients =
        ResponsibleResolver.resolveEmailAddressesForResponsibles(
          item.getResponsibleRawArray(),
        );
      recipients.forEach((recipient) => {
        if (!userMailHandlerMap.has(recipient)) {
          userMailHandlerMap.set(
            recipient,
            new ActionItemsMailHandler(
              this._senderAddress,
              recipient,
              this._minute,
            ),
          );
        }
        userMailHandlerMap.get(recipient).addActionItem(item);
      });
    });

    // iterate over all mail handler and send the mails
    for (const mailHandler of userMailHandlerMap.values()) {
      mailHandler.send();
    }
  }

  _sendInfoItems() {
    const recipients = this._minute.getPersonsInformedWithEmail(Meteor.users);

    const mailHandler = new InfoItemsMailHandler(
      this._senderAddress,
      recipients,
      this._minute,
      this._minute.topics,
      this._minute.parentMeetingSeries(),
      this._minute.getParticipants(Meteor.users),
      this._minute.getInformed(Meteor.users),
    );
    mailHandler.send();
  }
}
