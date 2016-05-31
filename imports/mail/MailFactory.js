import { GlobalSettings } from './../GlobalSettings'
import { MailgunMail } from './MailgunMail'
import { MeteorMail } from './MeteorMail'

export class MailFactory {

    static getMailer(replyTo, recipient) {
        let deliverer = GlobalSettings.getMailDeliverer();
        switch (deliverer) {
            case "mailgun":
                return new MailgunMail(replyTo, recipient);
            case "smtp":
                return new MeteorMail(replyTo, recipient);
            default:
                throw new Meteor.Error('illegal-state', 'Unknown mail deliverer: ' + deliverer);
        }
    }

}