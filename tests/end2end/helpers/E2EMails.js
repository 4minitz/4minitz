import { E2EGlobal } from "./E2EGlobal";

export class E2EMails {
  static resetSentMailsDb() {
    server.call("e2e.resetTestMailDB");
  }

  static getAllSentMails() {
    E2EGlobal.waitSomeTime(700);
    return server.call("e2e.findSentMails");
  }

  /**
   * Returns all recipients of all sent mails
   */
  static getAllRecipients() {
    const mails = E2EMails.getAllSentMails();
    let recipients = [];
    mails.forEach((mail) => {
      recipients = recipients.concat(mail.to);
    });
    return recipients;
  }
}
