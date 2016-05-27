import { TopicItemsMailHandler } from './TopicItemsMailHandler'

export class InfoItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipients, minute, topics) {
        super(sender, recipients, minute, 'publishInfoItems');
        this._topics = topics;
        this._sendSeparateMails = false;
        this._sender = sender;
        this._minute = minute;
    }

    _sendMail() {
        let mailSubject = this._getSubjectPrefix();
        this._buildMail(
            mailSubject,
            {
                minutesDate: this._minute.date,
                topics: this._topics
            }
        );
    }

}