import { Meteor } from 'meteor/meteor';
import { Mail } from './Mail';
import { GlobalSettings } from '../config/GlobalSettings';

export class MailgunMail extends Mail {

    constructor(replyTo, recipient) {
        super(replyTo, recipient);
    }

    _sendMail() {
        console.log('Sending mail via mailgun');

        let mailgunSettings = GlobalSettings.getMailgunSettings();

        let postURL = mailgunSettings.apiUrl + '/' + mailgunSettings.domain + '/messages';

        let recipient = (typeof this._recipients === 'string') ? [this._recipients] : this._recipients;

        let options =   {
            auth: 'api:' + mailgunSettings.apiKey,
            params: {
                'from': this._from,
                'to': recipient,
                'h:Reply-To': this._replyTo,
                'subject': this._subject
            }
        };
        if (this._text) {
            options.params.text = this._text;
        }
        if (this._html) {
            options.params.html = this._html;
        }

        // Send the request
        Meteor.http.post(postURL, options); // do not pass callback so the post request will run synchronously
    }

}