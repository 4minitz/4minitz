import { Meteor } from 'meteor/meteor';
import { GlobalSettings } from './../GlobalSettings'

export class Mail {

    constructor(replyTo, recipient) {
        this._replyTo = replyTo;
        this._recipient = recipient;
        this._from = GlobalSettings.getDefaultEmailSenderAddress();
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
            throw new Meteor.Error('invalid-state', 'You must set either html or text as email content');
        }
    }

}