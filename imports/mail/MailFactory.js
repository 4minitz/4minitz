import { GlobalSettings } from './../GlobalSettings'
import { MailgunMail } from './MailgunMail'
import { MeteorMail } from './MeteorMail'

export class MailFactory {

    static getMailer(replyTo, recipients) {
        let deliverer = GlobalSettings.getMailDeliverer();
        switch (deliverer) {
            case "mailgun":
                return new MailgunMail(replyTo, recipients);
            case "smtp":
                return new MeteorMail(replyTo, recipients);
            default:
                throw new Meteor.Error('illegal-state', 'Unknown mail deliverer: ' + deliverer);
        }
    }

}