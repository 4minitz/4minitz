import { Mail } from './Mail';
import { GlobalSettings } from './../GlobalSettings'

export class MailgunMail extends Mail {

    constructor(replyTo, recipient) {
        super(replyTo, recipient);
    }

    send() {
        console.log("Sending mail via mailgun");
        super.send();

        let mailgunSettings = GlobalSettings.getMailgunSettings();

        let postURL = mailgunSettings.apiUrl + '/' + mailgunSettings.domain + '/messages';
        let options =   {
            auth: "api:" + mailgunSettings.apiKey,
            params: {
                "from": this._from,
                "to": [this._recipient],
                "h:Reply-To": this._replyTo,
                "subject": this._subject
            }
        };
        if (this._text) {
            options.params.text = this._text;
        }
        if (this._html) {
            options.params.html = this._html;
        }
        var onError = function(error, result) {
            // todo: what shall we do with an email error... ? and what is the result?
            if(error) {console.log("Error: " + error)}
        };

        // Send the request
        Meteor.http.post(postURL, options, onError);
    }

}