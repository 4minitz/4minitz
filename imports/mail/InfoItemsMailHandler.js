import { TopicItemsMailHandler } from './TopicItemsMailHandler'
import { GlobalSettings } from './../GlobalSettings'
import { Topic } from './../topic'

export class InfoItemsMailHandler extends TopicItemsMailHandler {

    constructor(sender, recipients, minute, topics, meetingSeries, participants) {
        super(sender, recipients, minute, 'publishInfoItems');
        this._topics = topics;
        this._sendSeparateMails = false;
        this._sender = sender;
        this._minute = minute;
        this._meetingSeries = meetingSeries;
        this._participants = participants;
    }

    _sendMail() {
        let mailSubject = this._getSubjectPrefix();

        let presentParticipants = this._participants.filter(participant => {
            return participant.present;
        });
        let absentParticipants = this._participants.filter(participant => {
            return !participant.present;
        });

        // Generate responsibles strings for all topics
        this._topics.forEach(topic => {
            let aTopicObj = new Topic (this._minute._id, topic);
            topic.responsiblesString = "";
            if (aTopicObj.hasResponsibles()) {
                topic.responsiblesString = "("+aTopicObj.getResponsiblesString()+")";
            }
        });

        let discussedTopics = this._topics.filter(topic => {
            return !topic.isOpen;
        });
        let skippedTopics = this._topics.filter(topic => {
            return topic.isOpen;
        });
        
        this._buildMail(
            mailSubject,
            {
                minutesDate: this._minute.date,
                meetingSeriesName: this._meetingSeries.name,
                meetingSeriesProject: this._meetingSeries.project,
                meetingSeriesURL: GlobalSettings.getRootUrl("meetingseries/" + this._meetingSeries._id),
                minuteUrl: GlobalSettings.getRootUrl("minutesedit/" + this._minute._id),
                presentParticipants: this._participantsArrayToString(presentParticipants),
                absentParticipants: this._participantsArrayToString(absentParticipants),
                participantsAdditional: this._minute.participantsAdditional,
                discussedTopics: discussedTopics,
                skippedTopics: skippedTopics
            }
        );
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