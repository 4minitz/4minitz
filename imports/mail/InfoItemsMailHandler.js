import { TopicItemsMailHandler } from './TopicItemsMailHandler'
import { GlobalSettings } from './../GlobalSettings'
import { Topic } from './../topic'

export class InfoItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipients, minute, topics, meetingSeries, participants, template = 'publishInfoItems') {
        super(sender, recipients, minute, template);
        this._topics = topics;
        this._sender = sender;
        this._minute = minute;
        this._meetingSeries = meetingSeries;
        this._participants = participants;
    }

    _getSubject() {
        return this._getSubjectPrefix()  + " (Meeting Minutes V"+this._minute.finalizedVersion+")";
    }

    _sendMail() {
        let mailSubject = this._getSubject();

        // Generate responsibles strings for all topics
        this._topics.forEach(topic => {
            let aTopicObj = new Topic (this._minute._id, topic);
            topic.responsiblesString = "";
            if (aTopicObj.hasResponsibles()) {
                topic.responsiblesString = "("+aTopicObj.getResponsiblesString()+")";
            }
        });
        
        this._buildMail(
            mailSubject,
            this._getEmailData()
        );
    }

    _getEmailData() {
        let presentParticipants = this._participants.filter(participant => {
            return participant.present;
        });

        let absentParticipants = this._participants.filter(participant => {
            return !participant.present;
        });

        let discussedTopics = this._topics.filter(topic => {
            return !topic.isOpen;
        });

        let skippedTopics = this._topics.filter(topic => {
            return topic.isOpen;
        });

        return {
            minutesDate: this._minute.date,
            meetingSeriesName: this._meetingSeries.name,
            meetingSeriesProject: this._meetingSeries.project,
            meetingSeriesURL: GlobalSettings.getRootUrl("meetingseries/" + this._meetingSeries._id),
            minuteUrl: GlobalSettings.getRootUrl("minutesedit/" + this._minute._id),
            presentParticipants: this._participantsArrayToString(presentParticipants),
            absentParticipants: this._participantsArrayToString(absentParticipants),
            participantsAdditional: this._minute.participantsAdditional,
            discussedTopics: discussedTopics,
            skippedTopics: skippedTopics,
            finalizedVersion: this._minute.finalizedVersion
        };
    }

    _participantsArrayToString(participants) {
        let str = "";
        let first = true;
        participants.forEach(participant => {
            if (first) {
                first = false;
            } else {
                str += ", ";
            }
            str += participant.name;
        });

        return str;
    }

}