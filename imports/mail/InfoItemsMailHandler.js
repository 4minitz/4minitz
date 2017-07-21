import { TopicItemsMailHandler } from './TopicItemsMailHandler';
import { DocumentGeneration } from '../documentGeneration';

export class InfoItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipients, minute, topics, meetingSeries, participants, informed, template = 'publishInfoItems') {
        super(sender, recipients, minute, template);
        this._topics = topics;
        this._sender = sender;
        this._minute = minute;
        this._meetingSeries = meetingSeries;
        this._participants = participants;
        this._informed = informed;
    }

    _getSubject() {
        return this._getSubjectPrefix()  + ' (Meeting Minutes V'+this._minute.finalizedVersion+')';
    }

    _sendMail() {
        let mailSubject = this._getSubject();

        DocumentGeneration.generateResponsibleStringsForTopic(this);

        this._buildMail(
            mailSubject,
            DocumentGeneration.getDocumentData(this)
        );
    }

    _userArrayToString(users) {
        return users.map(function(user){
            return user.name;
        }).join(', ');
    }
}
