import { TopicItemsMailHandler } from './TopicItemsMailHandler'

export class InfoItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipients, minute, topics, msName, participants) {
        super(sender, recipients, minute, 'publishInfoItems');
        this._topics = topics;
        this._sendSeparateMails = false;
        this._sender = sender;
        this._minute = minute;
        this._msName = msName;
        this._participants = participants;
    }

    _sendMail() {
        let mailSubject = this._getSubjectPrefix();
        this._buildMail(
            mailSubject,
            {
                minutesDate: this._minute.date,
                meetingSeriesName: this._msName,
                participants: this._participants,
                participantsAdditional: this._minute.participantsAdditional,
                topics: this._topics
            }
        );
    }

}