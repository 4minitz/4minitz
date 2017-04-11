

export class E2EMails {

    static resetSentMailsDb() {
        server.call('e2e.resetTestMailDB');
    }

    static getAllSentMails() {
        return server.call('e2e.findSentMails');
    }

    /**
     * Returns all recipients of all sent mails
     */
    static getAllRecipients() {
        let mails = E2EMails.getAllSentMails();
        let recipients = [];
        mails.forEach(mail => {
            recipients = recipients.concat(mail.to);
        });
        return recipients;
    }
}