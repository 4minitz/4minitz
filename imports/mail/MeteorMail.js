import { Mail } from './Mail';
import { Email } from 'meteor/email';

export class MeteorMail extends Mail{

    constructor(replyTo, recipient) {
        super(replyTo, recipient);
    }

    send() {
        super.send();

        let config = {
            to: this._recipient,
            from: this._from,
            replyTo: this._replyTo,
            subject: this._subject
        };

        if (this._text) {
            config.text = this._text;
        }
        if (this._html) {
            config.html = this._html;
        }

        Email.send(config);
    }

}